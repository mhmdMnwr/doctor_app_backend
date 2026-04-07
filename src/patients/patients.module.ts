import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient, PatientSchema } from './schemas/patient.schema';
import {
  Certificate,
  CertificateSchema,
} from '../certificates/schemas/certificate.schema';
import {
  Ordonnance,
  OrdonnanceSchema,
} from '../ordonnances/schemas/ordonnance.schema';
import { Analyze, AnalyzeSchema } from '../analyzes/schemas/analyze.schema';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: Certificate.name, schema: CertificateSchema },
      { name: Ordonnance.name, schema: OrdonnanceSchema },
      { name: Analyze.name, schema: AnalyzeSchema },
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(PatientsController);
  }
}
