import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { DrugController } from './drug.controller';
import { DrugService } from './drug.service';

@Module({
  imports: [AdminModule, HttpModule],
  controllers: [DrugController],
  providers: [DrugService],
  exports: [DrugService],
})
export class DrugModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(DrugController);
  }
}
