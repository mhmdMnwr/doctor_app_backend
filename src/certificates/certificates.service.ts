import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Certificate,
  CertificateDocument,
} from './schemas/certificate.schema';
import { CreateCertificateDto } from './dto/create-certificate.dto';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<CertificateDocument>,
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

  async create(dto: CreateCertificateDto) {
    const created = await this.certificateModel.create({
      patientId: dto.patientId,
      commentaire: dto.commentaire,
    });

    return {
      message: 'Certificate created successfully',
      data: created,
    };
  }

  async getAll(page?: string, limit?: string) {
    const { parsedPage, safeLimit, skip } = this.parsePagination(page, limit);

    const [certificates, total] = await Promise.all([
      this.certificateModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.certificateModel.countDocuments().exec(),
    ]);

    return {
      message: 'Certificates fetched successfully',
      data: certificates,
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

    const [certificates, total] = await Promise.all([
      this.certificateModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.certificateModel.countDocuments(filter).exec(),
    ]);

    return {
      message: 'Certificates fetched successfully',
      data: certificates,
      pagination: {
        page: parsedPage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async getByDate(date: string, endDate?: string) {
    const { rangeStart, rangeEnd } = this.buildDateRange(date, endDate);

    const certificates = await this.certificateModel
      .find({
        createdAt: {
          $gte: rangeStart,
          $lte: rangeEnd,
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      message: 'Certificates fetched successfully',
      data: certificates,
    };
  }

  async delete(certificateId: string) {
    if (!isValidObjectId(certificateId)) {
      throw new BadRequestException('Invalid certificate id');
    }

    const deleted = await this.certificateModel
      .findByIdAndDelete(certificateId)
      .exec();

    if (!deleted) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      message: 'Certificate deleted successfully',
    };
  }
}
