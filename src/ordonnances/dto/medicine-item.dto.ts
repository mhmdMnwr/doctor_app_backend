import { IsOptional, IsString } from 'class-validator';

export class MedicineItemDto {
  @IsOptional()
  @IsString()
  medicine?: string;

  @IsOptional()
  @IsString()
  dosage?: string;
}
