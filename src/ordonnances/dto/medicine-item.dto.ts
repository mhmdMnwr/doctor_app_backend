import { IsNotEmpty, IsString } from 'class-validator';

export class MedicineItemDto {
  @IsString()
  @IsNotEmpty()
  medicine!: string;

  @IsString()
  @IsNotEmpty()
  dosage!: string;
}
