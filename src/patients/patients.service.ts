import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  Certificate,
  CertificateDocument,
} from '../certificates/schemas/certificate.schema';
import {
  Ordonnance,
  OrdonnanceDocument,
} from '../ordonnances/schemas/ordonnance.schema';
import { Analyze, AnalyzeDocument } from '../analyzes/schemas/analyze.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name)
    private readonly patientModel: Model<PatientDocument>,
    @InjectModel(Certificate.name)
    private readonly certificateModel: Model<CertificateDocument>,
    @InjectModel(Ordonnance.name)
    private readonly ordonnanceModel: Model<OrdonnanceDocument>,
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

  async getAll(page?: string, limit?: string) {
    const { parsedPage, safeLimit, skip } = this.parsePagination(page, limit);

    const [patients, total] = await Promise.all([
      this.patientModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.patientModel.countDocuments().exec(),
    ]);

    return {
      message: 'Patients fetched successfully',
      data: patients,
      pagination: {
        page: parsedPage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async create(dto: CreatePatientDto) {
    const created = await this.patientModel.create({
      name: dto.name,
      familyName: dto.familyName,
      comment: dto.comment,
      phoneNumber: dto.phoneNumber,
      birthdate: dto.birthdate,
    });

    return {
      message: 'Patient created successfully',
      data: created,
    };
  }

  async update(patientId: string, dto: UpdatePatientDto) {
    if (!isValidObjectId(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }

    const updated = await this.patientModel
      .findByIdAndUpdate(patientId, dto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!updated) {
      throw new NotFoundException('Patient not found');
    }

    return {
      message: 'Patient updated successfully',
      data: updated,
    };
  }

  async delete(patientId: string) {
    if (!isValidObjectId(patientId)) {
      throw new BadRequestException('Invalid patient id');
    }

    const patient = await this.patientModel.findById(patientId).exec();
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const [certificatesResult, ordonnancesResult, analyzesResult] =
      await Promise.all([
        this.certificateModel.deleteMany({ patientId }).exec(),
        this.ordonnanceModel.deleteMany({ patientId }).exec(),
        this.analyzeModel.deleteMany({ patientId }).exec(),
      ]);

    await this.patientModel.findByIdAndDelete(patientId).exec();

    return {
      message: 'Patient and related medical records deleted successfully',
      deleted: {
        certificates: certificatesResult.deletedCount ?? 0,
        ordonnances: ordonnancesResult.deletedCount ?? 0,
        analyzes: analyzesResult.deletedCount ?? 0,
      },
    };
  }
}
