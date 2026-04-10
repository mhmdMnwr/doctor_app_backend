import { IsOptional, IsString } from 'class-validator';

export class DrugListQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
