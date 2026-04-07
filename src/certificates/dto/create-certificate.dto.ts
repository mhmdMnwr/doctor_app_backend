import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  commentaire!: string;
}
