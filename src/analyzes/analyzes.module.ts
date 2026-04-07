import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { AnalyzesController } from './analyzes.controller';
import { AnalyzesService } from './analyzes.service';
import { Analyze, AnalyzeSchema } from './schemas/analyze.schema';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature([{ name: Analyze.name, schema: AnalyzeSchema }]),
  ],
  controllers: [AnalyzesController],
  providers: [AnalyzesService],
  exports: [AnalyzesService],
})
export class AnalyzesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(AnalyzesController);
  }
}
