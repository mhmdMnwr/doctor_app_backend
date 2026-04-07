import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

type AuthTokenPayload = {
  id: string;
  username: string;
  tokenVersion: number;
};

@Injectable()
export class AuthService {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  private async issueTokens(payload: AuthTokenPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: 'admin_access_secret',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: 'admin_refresh_secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto) {
    const admin = await this.adminService.findByUsername(loginDto.username);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    const isMatch = await bcrypt.compare(loginDto.password, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const currentTokenVersion = Number((admin as any).tokenVersion ?? 0);
    (admin as any).tokenVersion = currentTokenVersion + 1;
    await admin.save();

    const payload: AuthTokenPayload = {
      id: String(admin._id),
      username: admin.username,
      tokenVersion: Number((admin as any).tokenVersion ?? 0),
    };

    const tokens = await this.issueTokens(payload);

    return {
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.adminService.findById(adminId);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      admin.password,
    );

    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    admin.password = await bcrypt.hash(dto.newPassword, 10);
    const currentTokenVersion = Number((admin as any).tokenVersion ?? 0);
    (admin as any).tokenVersion = currentTokenVersion + 1;
    await admin.save();

    return { message: 'Password changed successfully' };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: AuthTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<AuthTokenPayload>(
        dto.refreshToken,
        {
          secret: 'admin_refresh_secret',
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const admin = await this.adminService.findById(payload.id);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    if (
      payload.username !== admin.username ||
      payload.tokenVersion !== Number((admin as any).tokenVersion ?? 0)
    ) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const currentTokenVersion = Number((admin as any).tokenVersion ?? 0);
    (admin as any).tokenVersion = currentTokenVersion + 1;
    await admin.save();

    const newPayload: AuthTokenPayload = {
      id: String(admin._id),
      username: admin.username,
      tokenVersion: Number((admin as any).tokenVersion ?? 0),
    };

    const tokens = await this.issueTokens(newPayload);

    return {
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }
}
