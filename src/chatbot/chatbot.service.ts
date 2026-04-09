import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatbotMessageDto } from './dto/chatbot-message.dto';

type GeminiPart = { text?: string };
type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};
type GeminiError = { message?: string };
type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
  error?: GeminiError;
};

@Injectable()
export class ChatbotService {
  constructor(private readonly configService: ConfigService) {}

  async sendMessage(dto: ChatbotMessageDto) {
    const model = this.getModel();
    const apiKey = this.getApiKey();

    const body: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts: [{ text: dto.message }],
        },
      ],
    };

    if (dto.systemInstruction?.trim()) {
      body.systemInstruction = {
        parts: [{ text: dto.systemInstruction.trim() }],
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new ServiceUnavailableException('Gemini service is unreachable');
    }

    const rawBody = await response.text();
    let parsedBody: GeminiGenerateContentResponse = {};
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody) as GeminiGenerateContentResponse;
      } catch {
        throw new BadGatewayException('Invalid response received from Gemini');
      }
    }

    if (!response.ok) {
      throw new BadGatewayException(
        parsedBody.error?.message ??
          `Gemini request failed with status ${response.status}`,
      );
    }

    const reply =
      parsedBody.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text?.trim())
        .filter((text): text is string => Boolean(text))
        .join('\n')
        .trim() ?? '';

    if (!reply) {
      throw new BadGatewayException('Gemini returned an empty response');
    }

    return {
      message: 'Chatbot response generated successfully',
      data: {
        model,
        reply,
      },
    };
  }

  private getModel(): string {
    const model =
      this.configService.get<string>('GEMINI_MODEL') ??
      this.configService.get<string>('Gemini_MODEL');

    if (!model?.trim()) {
      throw new InternalServerErrorException('Gemini model is not configured');
    }

    return model.trim();
  }

  private getApiKey(): string {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ??
      this.configService.get<string>('Gemini_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('Gemini API key is not configured');
    }

    return apiKey;
  }
}
