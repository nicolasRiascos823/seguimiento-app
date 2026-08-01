import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { Response } from 'express';
import { IsNull, Repository } from 'typeorm';
import { RefreshToken, User } from '../database/entities';
import { UserStatus } from '../database/enums';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepo: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, res: Response, meta?: { ip?: string; ua?: string }) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Usuario inactivo');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role, user.fullName);
    this.setRefreshCookie(res, tokens.refreshToken);

    await this.audit.log({
      actorId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return {
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    };
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokensRepo.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.user.status !== UserStatus.ACTIVE || stored.user.deletedAt) {
      throw new ForbiddenException('Usuario inactivo');
    }

    await this.refreshTokensRepo.update(stored.id, { revokedAt: new Date() });

    const tokens = await this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      stored.user.fullName,
    );
    this.setRefreshCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: {
        id: stored.user.id,
        email: stored.user.email,
        fullName: stored.user.fullName,
        role: stored.user.role,
        status: stored.user.status,
      },
    };
  }

  async logout(refreshToken: string | undefined, res: Response, userId?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.refreshTokensRepo.update(
        { tokenHash, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
    }

    this.clearRefreshCookie(res);

    if (userId) {
      await this.audit.log({
        actorId: userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
      });
    }

    return { message: 'Sesión cerrada' };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user;
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    fullName: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role, fullName },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '15m') as `${number}m`,
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const days = this.parseDays(
      this.config.get<string>('JWT_REFRESH_EXPIRES', '7d'),
    );
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const entry = this.refreshTokensRepo.create({
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });
    await this.refreshTokensRepo.save(entry);

    return { accessToken, refreshToken };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private setRefreshCookie(res: Response, token: string) {
    const secure = this.config.get<string>('COOKIE_SECURE') === 'true';
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  }

  private parseDays(value: string) {
    const match = /^(\d+)d$/.exec(value);
    return match ? Number(match[1]) : 7;
  }
}
