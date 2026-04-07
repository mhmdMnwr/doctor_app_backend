import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminModule } from '../admin/admin.module';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { OrdonnancesController } from './ordonnances.controller';
import { OrdonnancesService } from './ordonnances.service';
import { Ordonnance, OrdonnanceSchema } from './schemas/ordonnance.schema';

@Module({
  imports: [
    AdminModule,
    MongooseModule.forFeature([
      { name: Ordonnance.name, schema: OrdonnanceSchema },
    ]),
  ],
  controllers: [OrdonnancesController],
  providers: [OrdonnancesService],
  exports: [OrdonnancesService],
})
export class OrdonnancesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes(OrdonnancesController);
  }
}
