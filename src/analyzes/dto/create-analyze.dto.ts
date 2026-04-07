import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateAnalyzeDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  analyzeNames!: string[];
}
