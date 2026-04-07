import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Ordonnance,
  OrdonnanceDocument,
} from './schemas/ordonnance.schema';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { UpdateOrdonnanceDto } from './dto/update-ordonnance.dto';

@Injectable()
export class OrdonnancesService {
  constructor(
    @InjectModel(Ordonnance.name)
    private readonly ordonnanceModel: Model<OrdonnanceDocument>,
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

  async create(dto: CreateOrdonnanceDto) {
    const created = await this.ordonnanceModel.create({
      patientId: dto.patientId,
      medicines: dto.medicines,
      diagnostic: dto.diagnostic,
    });

    return {
      message: 'Ordonnance created successfully',
      data: created,
    };
  }

  async getAll(page?: string, limit?: string) {
    const { parsedPage, safeLimit, skip } = this.parsePagination(page, limit);

    const [ordonnances, total] = await Promise.all([
      this.ordonnanceModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.ordonnanceModel.countDocuments().exec(),
    ]);

    return {
      message: 'Ordonnances fetched successfully',
      data: ordonnances,
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

    const [ordonnances, total] = await Promise.all([
      this.ordonnanceModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.ordonnanceModel.countDocuments(filter).exec(),
    ]);

    return {
      message: 'Ordonnances fetched successfully',
      data: ordonnances,
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

    const ordonnances = await this.ordonnanceModel
      .find({
        createdAt: {
          $gte: rangeStart,
          $lte: rangeEnd,
        },
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      message: 'Ordonnances fetched successfully',
      data: ordonnances,
    };
  }

  async getById(ordonnanceId: string) {
    if (!isValidObjectId(ordonnanceId)) {
      throw new BadRequestException('Invalid ordonnance id');
    }

    const ordonnance = await this.ordonnanceModel
      .findById(ordonnanceId)
      .exec();

    if (!ordonnance) {
      throw new NotFoundException('Ordonnance not found');
    }

    return ordonnance;
  }

  async update(ordonnanceId: string, dto: UpdateOrdonnanceDto) {
    if (!isValidObjectId(ordonnanceId)) {
      throw new BadRequestException('Invalid ordonnance id');
    }

    const updated = await this.ordonnanceModel
      .findByIdAndUpdate(ordonnanceId, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Ordonnance not found');
    }

    return {
      message: 'Ordonnance updated successfully',
      data: updated,
    };
  }

  async delete(ordonnanceId: string) {
    if (!isValidObjectId(ordonnanceId)) {
      throw new BadRequestException('Invalid ordonnance id');
    }

    const deleted = await this.ordonnanceModel
      .findByIdAndDelete(ordonnanceId)
      .exec();

    if (!deleted) {
      throw new NotFoundException('Ordonnance not found');
    }

    return {
      message: 'Ordonnance deleted successfully',
    };
  }
}
