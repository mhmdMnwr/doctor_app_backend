import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { OrdonnancesModule } from './ordonnances/ordonnances.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AnalyzesModule } from './analyzes/analyzes.module';
import { PatientsModule } from './patients/patients.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { DrugModule } from './drugs/drug.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') 
      }),
      inject: [ConfigService],
    }),
    AdminModule,
    AuthModule,
    OrdonnancesModule,
    CertificatesModule,
    AnalyzesModule,
    PatientsModule,
    ChatbotModule,
    DrugModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
