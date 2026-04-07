import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Analyze, AnalyzeDocument } from './schemas/analyze.schema';
import { CreateAnalyzeDto } from './dto/create-analyze.dto';
import { UpdateAnalyzeDto } from './dto/update-analyze.dto';

@Injectable()
export class AnalyzesService {
  constructor(
    @InjectModel(Analyze.name)
    private readonly analyzeModel: Model<AnalyzeDocument>,
  ) {}

  private parsePagination(page?: string, limit?: string) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 10;

    if (!Number.isInteger(parsedPage) || parsedPage < 1) {
      throw new BadRequestException('page must be a positive integer');
    }

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException('limit must be a positive integer');
    }

    const safeLimit = Math.min(parsedLimit, 100);
    const skip = (parsedPage - 1) * safeLimit;

    return { parsedPage, safeLimit, skip };
  }

  private buildDateRange(date: string, endDate?: string) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const rangeStart = new Date(parsedDate);
    rangeStart.setHours(0, 0, 0, 0);

    if (!endDate || endDate.trim() === '') {
      const exactDayEnd = new Date(rangeStart);
      exactDayEnd.setHours(23, 59, 59, 999);
      return { rangeStart, rangeEnd: exactDayEnd };
    }

    const parsedEndDate = new Date(endDate);
    if (Number.isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    const rangeEnd = new Date(parsedEndDate);
    if (endDate.length <= 10) {
      rangeEnd.setHours(23, 59, 59, 999);
    }

    if (rangeEnd.getTime() < rangeStart.getTime()) {
      throw new BadRequestException('endDate must be after or equal to date');
    }

    return { rangeStart, rangeEnd };
  }

  async create(dto: CreateAnalyzeDto) {
    const created = await this.analyzeModel.create({
      patientId: dto.patientId,
      analyzeNames: dto.analyzeNames,
    });

    return {
      message: 'Analyze created successfully',
      data: created,
    };
  }

  async getAll(page?: string, limit?: string) {
    const { parsedPage, safeLimit, skip } = this.parsePagination(page, limit);

    const [analyzes, total] = await Promise.all([
      this.analyzeModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.analyzeModel.countDocuments().exec(),
    ]);

    return {
      message: 'Analyzes fetched successfully',
      data: analyzes,
      pagination: {
        page: parsedPage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async getByPatientId(patientId: string, page?: string, limit?: string) {
    if (!patientId || patientId.trim() === '') {
      throw new BadRequestException('patientId is required');
    }

    const { parsedPage, safeLimit, skip } = this.parsePagination(page, limit);
    const filter = { patientId };

    const [analyzes, total] = await Promise.all([
      this.analyzeModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.analyzeModel.countDocuments(filter).exec(),
    ]);

    return {
      message: 'Analyzes fetched successfully',
      data: analyzes,
      pagination: {
        page: parsedPage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async getById(analyzeId: string) {
    if (!isValidObjectId(analyzeId)) {
      throw new BadRequestException('Invalid analyze id');
    }

    const analyze = await this.analyzeModel.findById(analyzeId).exec();
    if (!analyze) {
      throw new NotFoundException('Analyze not found');
    }

    return analyze;
  }

  async getByDate(date: string, endDate?: string) {
    const { rangeStart, rangeEnd } = this.buildDateRange(date, endDate);

    const analyzes = await this.analyzeModel
      .find({
        createdAt: {
          $gte: rangeStart,
          $lte: rangeEnd,
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      message: 'Analyzes fetched successfully',
      data: analyzes,
    };
  }

  async update(analyzeId: string, dto: UpdateAnalyzeDto) {
    if (!isValidObjectId(analyzeId)) {
      throw new BadRequestException('Invalid analyze id');
    }

    const updated = await this.analyzeModel
      .findByIdAndUpdate(analyzeId, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Analyze not found');
    }

    return {
      message: 'Analyze updated successfully',
      data: updated,
    };
  }

  async delete(analyzeId: string) {
    if (!isValidObjectId(analyzeId)) {
      throw new BadRequestException('Invalid analyze id');
    }

    const deleted = await this.analyzeModel.findByIdAndDelete(analyzeId).exec();

    if (!deleted) {
      throw new NotFoundException('Analyze not found');
    }

    return {
      message: 'Analyze deleted successfully',
    };
  }
}
