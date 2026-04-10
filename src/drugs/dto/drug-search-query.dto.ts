import { IsNotEmpty, IsString } from 'class-validator';

export class DrugSearchQueryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}
