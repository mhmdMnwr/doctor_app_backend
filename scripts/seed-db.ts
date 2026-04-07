import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { AppModule } from '../src/app.module';
import { Admin } from '../src/admin/schemas/admin.schema';
import { Patient } from '../src/patients/schemas/patient.schema';
import { Certificate } from '../src/certificates/schemas/certificate.schema';
import { Ordonnance } from '../src/ordonnances/schemas/ordonnance.schema';
import { Analyze } from '../src/analyzes/schemas/analyze.schema';

type SeedPatient = {
  name: string;
  familyName: string;
  comment?: string;
  phoneNumber?: string;
  birthdate: Date;
};

async function bootstrap() {
  // Create an app context without starting HTTP server
  const app = await NestFactory.createApplicationContext(AppModule);

  const adminModel = app.get<Model<Admin>>(getModelToken(Admin.name));
  const patientModel = app.get<Model<Patient>>(getModelToken(Patient.name));
  const certificateModel = app.get<Model<Certificate>>(
    getModelToken(Certificate.name),
  );
  const ordonnanceModel = app.get<Model<Ordonnance>>(
    getModelToken(Ordonnance.name),
  );
  const analyzeModel = app.get<Model<Analyze>>(getModelToken(Analyze.name));

  const resetDb = process.env.SEED_RESET !== 'false';

  if (resetDb) {
    await Promise.all([
      analyzeModel.deleteMany({}),
      ordonnanceModel.deleteMany({}),
      certificateModel.deleteMany({}),
      patientModel.deleteMany({}),
    ]);
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

  await adminModel.findOneAndUpdate(
    { username: adminUsername },
    {
      username: adminUsername,
      password: adminHashedPassword,
      tokenVersion: 0,
      address: 'Main Clinic',
      phoneNumber: '0555000000',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const PATIENTS_COUNT = 30;
  const RECORDS_COUNT = 50;

  const firstNames = [
    'Ahmed',
    'Sara',
    'Yacine',
    'Lina',
    'Nour',
    'Amine',
    'Imane',
    'Riad',
    'Sofiane',
    'Samia',
  ];
  const familyNames = [
    'Benali',
    'Mansouri',
    'Haddad',
    'Bouzid',
    'Amrani',
    'Benkhelifa',
    'Cherif',
    'Khelifi',
    'Brahimi',
    'Touati',
  ];
  const comments = [
    'Routine follow-up',
    'Needs monthly check',
    'Allergy history',
    'Diabetes monitoring',
    'Blood pressure follow-up',
  ];

  const patientsToSeed: SeedPatient[] = Array.from(
    { length: PATIENTS_COUNT },
    (_, i) => ({
      name: firstNames[i % firstNames.length],
      familyName: familyNames[(i * 3) % familyNames.length],
      comment: i % 2 === 0 ? comments[i % comments.length] : undefined,
      phoneNumber: i % 3 === 0 ? undefined : `0555${String(100000 + i)}`,
      birthdate: new Date(1975 + (i % 25), (i * 2) % 12, ((i * 5) % 28) + 1),
    }),
  );

  const createdPatients = await patientModel.insertMany(patientsToSeed);
  const patientIds = createdPatients.map((p) => String(p._id));

  const certificateComments = [
    'Needs rest for 2 days',
    'Fitness certificate after checkup',
    'Medical leave for one week',
    'Avoid physical effort for 5 days',
    'Follow-up consultation in 10 days',
  ];

  const certificatesToSeed = Array.from({ length: RECORDS_COUNT }, (_, i) => ({
    patientId: patientIds[i % patientIds.length],
    commentaire: certificateComments[i % certificateComments.length],
  }));

  const diagnostics = [
    'Viral fever',
    'Seasonal allergy',
    'Gastritis',
    'Migraine',
    'Upper respiratory infection',
  ];
  const medicinesCatalog = [
    { medicine: 'Paracetamol', dosage: '500mg twice daily' },
    { medicine: 'Omeprazole', dosage: '20mg before breakfast' },
    { medicine: 'Cetirizine', dosage: '10mg at night' },
    { medicine: 'Ibuprofen', dosage: '400mg after meals' },
    { medicine: 'Amoxicillin', dosage: '1g every 12h' },
  ];

  const ordonnancesToSeed = Array.from({ length: RECORDS_COUNT }, (_, i) => {
    const medicinesCount = (i % 3) + 1;
    const medicines = Array.from({ length: medicinesCount }, (_, j) => {
      return medicinesCatalog[(i + j) % medicinesCatalog.length];
    });

    return {
      patientId: patientIds[(i * 2) % patientIds.length],
      medicines,
      diagnostic: diagnostics[i % diagnostics.length],
    };
  });

  const analyzePanels = [
    ['CBC', 'CRP'],
    ['HbA1c', 'Lipid Profile'],
    ['Vitamin D', 'Calcium'],
    ['TSH', 'T3', 'T4'],
    ['Creatinine', 'Urea'],
  ];

  const analyzesToSeed = Array.from({ length: RECORDS_COUNT }, (_, i) => ({
    patientId: patientIds[(i * 4) % patientIds.length],
    analyzeNames: analyzePanels[i % analyzePanels.length],
  }));

  await certificateModel.insertMany(certificatesToSeed);
  await ordonnanceModel.insertMany(ordonnancesToSeed);
  await analyzeModel.insertMany(analyzesToSeed);

  console.log('Database seeded successfully.');
  console.log(`Patients: ${createdPatients.length}`);
  console.log(`Certificates: ${certificatesToSeed.length}`);
  console.log(`Ordonnances: ${ordonnancesToSeed.length}`);
  console.log(`Analyzes: ${analyzesToSeed.length}`);

  await app.close();
}

bootstrap().catch(async (error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
