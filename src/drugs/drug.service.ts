import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { DrugDetailsDto } from './dto/drug-details.dto';
import { DrugListItemDto } from './dto/drug-list-item.dto';

type OpenFdaDrugLabel = {
  id?: string;
  set_id?: string;
  purpose?: string[];
  indications_and_usage?: string[];
  warnings?: string[];
  openfda?: {
    id?: string[];
    set_id?: string[];
    brand_name?: string[];
    generic_name?: string[];
  };
};

type OpenFdaResponse = {
  meta?: {
    results?: {
      total?: number;
    };
  };
  results?: OpenFdaDrugLabel[];
};

@Injectable()
export class DrugService {
  private readonly openFdaUrl = 'https://api.fda.gov/drug/label.json';
  private readonly defaultLimit = 10;
  private readonly maxLimit = 100;

  constructor(private readonly httpService: HttpService) {}

  async searchByName(name: string): Promise<string[]> {
    const normalizedName = this.normalizeSearchName(name);
    const candidates = await this.searchCandidatesByNormalizedName(
      normalizedName,
      true,
    );

    return candidates.slice(0, 10).map((entry) => entry.name);
  }

  async resolveByName(name: string): Promise<DrugListItemDto> {
    const normalizedName = this.normalizeSearchName(name);
    const candidates = await this.searchCandidatesByNormalizedName(
      normalizedName,
      false,
    );

    if (candidates.length === 0) {
      throw new NotFoundException('Drug not found');
    }

    const exactMatch = candidates.find(
      (entry) =>
        this.normalizeForMatch(entry.name) === normalizedName ||
        this.normalizeForMatch(entry.generic_name) === normalizedName,
    );

    return exactMatch ?? candidates[0];
  }

  async getPaginatedList(page?: string, limit?: string) {
    const { parsedPage, parsedLimit, skip } = this.parsePagination(page, limit);

    const response = await this.fetchLabels(
      {
        limit: parsedLimit,
        skip,
      },
      { returnEmptyOnNotFound: true, returnEmptyOnFailure: true },
    );

    const data = this.mapOpenFdaListItems(response.results ?? []);
    const total = response.meta?.results?.total ?? 0;

    return {
      data,
      page: parsedPage,
      total,
    };
  }

  async getById(id: string): Promise<DrugDetailsDto> {
    const normalizedId = id?.trim();
    if (!normalizedId) {
      throw new BadRequestException('id is required');
    }

    const escapedId = this.escapeValue(normalizedId);
    const search = `openfda.id:"${escapedId}" OR openfda.set_id:"${escapedId}" OR set_id:"${escapedId}" OR id:"${escapedId}"`;

    const response = await this.fetchLabels({ search, limit: 1 });
    const item = response.results?.[0];

    if (!item) {
      throw new NotFoundException('Drug not found');
    }

    return {
      id: this.resolveItemIdFromLabel(item) ?? normalizedId,
      name:
        this.getFirst(item.openfda?.brand_name) ??
        this.getFirst(item.openfda?.generic_name) ??
        '',
      generic_name: this.getFirst(item.openfda?.generic_name) ?? '',
      purpose: this.joinText(item.purpose),
      indications_and_usage: this.joinText(item.indications_and_usage),
      warnings: this.joinText(item.warnings),
    };
  }

  private parsePagination(page?: string, limit?: string) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : this.defaultLimit;

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new BadRequestException('page must be a positive integer');
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }

    const safeLimit = Math.min(parsedLimit, this.maxLimit);
    const skip = (parsedPage - 1) * safeLimit;

    return { parsedPage, parsedLimit: safeLimit, skip };
  }

  private normalizeSearchName(name: string) {
    const normalized = name?.trim();
    if (!normalized) {
      throw new BadRequestException('name query parameter is required');
    }

    return this.normalizeForMatch(normalized);
  }

  private normalizeForMatch(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private buildSearchTerms(normalizedName: string) {
    const terms = new Set<string>([normalizedName]);

    if (
      'paracetamol'.includes(normalizedName) ||
      normalizedName.includes('paracetamol')
    ) {
      terms.add('paracetamol');
      terms.add('acetaminophen');
    }

    if (
      'acetaminophen'.includes(normalizedName) ||
      normalizedName.includes('acetaminophen')
    ) {
      terms.add('acetaminophen');
      terms.add('paracetamol');
    }

    return Array.from(terms);
  }

  private buildNameSearchQuery(searchTerms: string[]) {
    const clauses: string[] = [];

    for (const term of searchTerms) {
      const escapedTerm = this.escapeValue(term);
      clauses.push(`openfda.brand_name:"${escapedTerm}"`);
      clauses.push(`openfda.generic_name:"${escapedTerm}"`);
    }

    return clauses.join(' OR ');
  }

  private async searchCandidatesByNormalizedName(
    normalizedName: string,
    returnEmptyOnFailure: boolean,
  ): Promise<DrugListItemDto[]> {
    const searchTerms = this.buildSearchTerms(normalizedName);
    const search = this.buildNameSearchQuery(searchTerms);

    const response = await this.fetchLabels(
      { search, limit: this.maxLimit },
      { returnEmptyOnNotFound: true, returnEmptyOnFailure },
    );

    const labels = response.results ?? [];
    const rankedCandidates: Array<{ item: DrugListItemDto; score: number }> = [];
    const seenNames = new Set<string>();

    for (const label of labels) {
      const labelId = this.resolveItemIdFromLabel(label);
      if (!labelId) {
        continue;
      }

      const genericName = this.getFirst(label.openfda?.generic_name) ?? '';
      const labelRelevanceBoost = this.getLabelRelevanceBoost(label, searchTerms);

      for (const candidate of this.extractNames(label)) {
        if (!this.isCleanMedicineName(candidate)) {
          continue;
        }

        const key = this.normalizeForMatch(candidate);
        if (seenNames.has(key)) {
          continue;
        }

        seenNames.add(key);
        rankedCandidates.push({
          item: {
            id: labelId,
            name: candidate,
            generic_name: genericName,
          },
          score:
            labelRelevanceBoost +
            this.computeCandidateScore(candidate, normalizedName, searchTerms),
        });
      }
    }

    rankedCandidates.sort(
      (a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name),
    );

    return rankedCandidates.map((entry) => entry.item);
  }

  private resolveItemIdFromLabel(item: OpenFdaDrugLabel) {
    return (
      this.getFirst(item.openfda?.id) ??
      this.getFirst(item.openfda?.set_id) ??
      item.set_id?.trim() ??
      item.id?.trim()
    );
  }

  private mapOpenFdaListItems(results: OpenFdaDrugLabel[]) {
    const mapped: DrugListItemDto[] = [];

    for (const item of results) {
      const id = this.resolveItemIdFromLabel(item);
      if (!id) {
        continue;
      }

      const name =
        this.getFirst(item.openfda?.brand_name) ??
        this.getFirst(item.openfda?.generic_name) ??
        '';

      if (!name) {
        continue;
      }

      const genericName = this.getFirst(item.openfda?.generic_name) ?? '';

      mapped.push({
        id,
        name,
        generic_name: genericName,
      });
    }

    return mapped;
  }

  private extractNames(label: OpenFdaDrugLabel) {
    const candidates = [
      ...(label.openfda?.brand_name ?? []),
      ...(label.openfda?.generic_name ?? []),
    ];

    return candidates
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  }

  private getLabelRelevanceBoost(label: OpenFdaDrugLabel, searchTerms: string[]) {
    const genericNames = (label.openfda?.generic_name ?? []).map((value) =>
      value.toLowerCase(),
    );
    const brandNames = (label.openfda?.brand_name ?? []).map((value) =>
      value.toLowerCase(),
    );

    const hasGenericMatch = genericNames.some((generic) =>
      searchTerms.some((term) => generic.includes(term)),
    );

    if (hasGenericMatch) {
      return 50;
    }

    const hasBrandMatch = brandNames.some((brand) =>
      searchTerms.some((term) => brand.includes(term)),
    );

    return hasBrandMatch ? 20 : 0;
  }

  private computeCandidateScore(
    candidate: string,
    normalizedName: string,
    searchTerms: string[],
  ) {
    const candidateLower = candidate.toLowerCase();
    let score = 0;

    if (candidateLower.startsWith(normalizedName)) {
      score += 40;
    }

    if (candidateLower.includes(normalizedName)) {
      score += 25;
    }

    if (searchTerms.some((term) => candidateLower.includes(term))) {
      score += 20;
    }

    const wordsCount = candidateLower.split(/\s+/).length;
    score += Math.max(0, 8 - wordsCount);

    return score;
  }

  private isCleanMedicineName(name: string) {
    if (!name || name.length > 80) {
      return false;
    }

    if (/[,;]/.test(name)) {
      return false;
    }

    if (name.includes('/')) {
      return false;
    }

    if (name.split(/\s+/).length > 7) {
      return false;
    }

    return true;
  }

  private getFirst(values?: string[]) {
    if (!values?.length) {
      return undefined;
    }

    const first = values[0]?.trim();
    return first ? first : undefined;
  }

  private joinText(values?: string[]) {
    if (!values?.length) {
      return '';
    }

    return values
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .join(' ');
  }

  private escapeValue(value: string) {
    return value.replace(/"/g, '\\"');
  }

  private isRetryableAxiosError(error: AxiosError) {
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  private async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async fetchLabels(
    params: { search?: string; limit?: number; skip?: number },
    options?: { returnEmptyOnNotFound?: boolean; returnEmptyOnFailure?: boolean },
  ): Promise<OpenFdaResponse> {
    const attempts = 3;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const { data } = await firstValueFrom(
          this.httpService.get<OpenFdaResponse>(this.openFdaUrl, {
            params,
            timeout: 15000,
          }),
        );

        return data ?? {};
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          if (options?.returnEmptyOnNotFound) {
            return { meta: { results: { total: 0 } }, results: [] };
          }

          throw new NotFoundException('Drug not found');
        }

        if (
          error instanceof AxiosError &&
          this.isRetryableAxiosError(error) &&
          attempt < attempts
        ) {
          await this.delay(attempt * 250);
          continue;
        }

        if (options?.returnEmptyOnFailure) {
          return { meta: { results: { total: 0 } }, results: [] };
        }

        if (error instanceof AxiosError && error.response?.status === 429) {
          throw new ServiceUnavailableException(
            'OpenFDA rate limit reached, please retry in a few seconds',
          );
        }

        if (error instanceof AxiosError && error.response?.status) {
          if (error.response.status >= 400 && error.response.status < 500) {
            throw new BadGatewayException('OpenFDA rejected the request');
          }

          if (error.response.status >= 500) {
            throw new ServiceUnavailableException('OpenFDA service is unavailable');
          }
        }

        if (error instanceof AxiosError) {
          throw new ServiceUnavailableException('OpenFDA service is unavailable');
        }

        throw new BadGatewayException('Failed to fetch data from OpenFDA');
      }
    }

    return { meta: { results: { total: 0 } }, results: [] };
  }
}
