import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MedicineItemDto } from './medicine-item.dto';

export class CreateOrdonnanceDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines!: MedicineItemDto[];

  @IsString()
  @IsNotEmpty()
  diagnostic!: string;
}
