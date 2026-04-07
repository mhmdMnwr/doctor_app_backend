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
import { AnalyzesService } from './analyzes.service';
import { CreateAnalyzeDto } from './dto/create-analyze.dto';
import { UpdateAnalyzeDto } from './dto/update-analyze.dto';

@Controller('analyzes')
export class AnalyzesController {
  constructor(private readonly analyzesService: AnalyzesService) {}

  @Get()
  getAll(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.analyzesService.getAll(page, limit);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateAnalyzeDto) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.analyzesService.create(dto);
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

    return this.analyzesService.getByPatientId(patientId, page, limit);
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

    return this.analyzesService.getByDate(date, endDate);
  }

  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.analyzesService.getById(id);
  }

  @Put(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateAnalyzeDto,
  ) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.analyzesService.update(id, dto);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.analyzesService.delete(id);
  }
}
