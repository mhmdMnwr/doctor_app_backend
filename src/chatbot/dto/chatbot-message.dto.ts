import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChatbotMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  systemInstruction?: string;
}
