import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../admin/admin.service';

type AccessTokenPayload = {
  id: string;
  username: string;
  tokenVersion: number;
};

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token not found');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: 'admin_access_secret',
      });

      if (!payload?.id || !payload?.username || payload.tokenVersion === undefined) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const admin = await this.adminService.findById(payload.id);
      if (!admin) {
        throw new UnauthorizedException('Admin not found');
      }

      if (
        admin.username !== payload.username ||
        Number((admin as any).tokenVersion ?? 0) !== payload.tokenVersion
      ) {
        throw new UnauthorizedException('Token is no longer valid');
      }

      req['user'] = {
        id: String(payload.id),
        username: payload.username,
        tokenVersion: payload.tokenVersion,
      };
      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
