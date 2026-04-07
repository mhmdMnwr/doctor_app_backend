import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateAnalyzeDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  analyzeNames?: string[];
}
