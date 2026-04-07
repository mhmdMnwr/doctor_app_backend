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
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  getAll(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.patientsService.getAll(page, limit);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreatePatientDto) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.patientsService.create(dto);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.patientsService.delete(id);
  }
}
