import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MedicineItemDto } from './medicine-item.dto';

export class UpdateOrdonnanceDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines?: MedicineItemDto[];

  @IsOptional()
  @IsString()
  diagnostic?: string;
}
