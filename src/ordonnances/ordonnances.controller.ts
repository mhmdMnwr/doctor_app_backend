import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdonnancesService } from './ordonnances.service';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { UpdateOrdonnanceDto } from './dto/update-ordonnance.dto';

@Controller('ordonnances')
export class OrdonnancesController {
  constructor(private readonly ordonnancesService: OrdonnancesService) {}

  @Get()
  getAll(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.ordonnancesService.getAll(page, limit);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateOrdonnanceDto) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.ordonnancesService.create(dto);
  }

  @Get('patient/:patientId')
  getByPatientId(
    @Req() req: Request,
    @Param('patientId') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.ordonnancesService.getByPatientId(patientId, page, limit);
  }

  @Get('by-date')
  getByDate(
    @Req() req: Request,
    @Query('date') date: string,
    @Query('endDate') endDate?: string,
  ) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.ordonnancesService.getByDate(date, endDate);
  }

  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.ordonnancesService.getById(id);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateOrdonnanceDto,
  ) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.ordonnancesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.ordonnancesService.delete(id);
  }
}
