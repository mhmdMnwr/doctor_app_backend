import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @HttpCode(HttpStatus.OK)
  @Post('message')
  sendMessage(@Req() req: Request, @Body() dto: ChatbotMessageDto) {
    const user = req['user'] as { id: string; username: string } | undefined;
    if (!user?.id) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return this.chatbotService.sendMessage(dto);
  }
}
