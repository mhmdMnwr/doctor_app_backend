import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CertificatesService } from './certificates.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  getAll(@Req() req: Request, @Query('page') page?: string, @Query('limit') limit?: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.certificatesService.getAll(page, limit);
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

    return this.certificatesService.getByPatientId(patientId, page, limit);
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

    return this.certificatesService.getByDate(date, endDate);
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateCertificateDto) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.certificatesService.create(dto);
  }

  @Delete(':id')
  delete(@Req() req: Request, @Param('id') id: string) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.certificatesService.delete(id);
  }
}
