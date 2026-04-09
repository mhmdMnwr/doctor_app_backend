import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MedicineItemDto } from './medicine-item.dto';

export class CreateOrdonnanceDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines?: MedicineItemDto[];

  @IsString()
  @IsNotEmpty()
  diagnostic!: string;
}
