import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from '../../shared/utils/response';
import { publishEvent } from '../../shared/events/event-publisher';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: {
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, ...(data.phone ? [{ phone: data.phone }] : [])] },
    });

    if (existing) {
      throw new AppError('Email or phone already registered', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role || UserRole.BUYER,
      },
    });

    if (user.role === UserRole.BUYER) {
      await this.prisma.buyerProfile.create({
        data: { id: uuidv4(), userId: user.id },
      });
      await this.prisma.cart.create({ data: { id: uuidv4(), userId: user.id } });
      await this.prisma.loyaltyAccount.create({ data: { id: uuidv4(), userId: user.id } });
    }

    await publishEvent({
      eventName: 'user.registered',
      actorId: user.id,
      actorType: 'user',
      entityId: user.id,
      entityType: 'user',
      payload: { email: user.email, role: user.role },
      source: 'buyer_web',
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('Invalid credentials', 401);
    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid credentials', 401);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await publishEvent({
      eventName: 'user.logged_in',
      actorId: user.id,
      actorType: 'user',
      entityId: user.id,
      entityType: 'user',
    });

    const shopId = await this.getSellerShopId(user.id, user.role);
    const tokens = await this.generateTokens(user.id, user.email, user.role, shopId);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshToken(token: string) {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { token, revokedAt: null },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Refresh token expired or invalid', 401);
    }

    if (stored.userId !== decoded.userId) {
      throw new AppError('Token mismatch', 401);
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const shopId = await this.getSellerShopId(stored.user.id, stored.user.role);
    return this.generateTokens(stored.user.id, stored.user.email, stored.user.role, shopId);
  }

  async logout(userId: string, token: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, token },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If email exists, reset link will be sent' };

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: `reset_${resetToken}`,
        userId: user.id,
        expiresAt,
      },
    });

    // In production, send email with resetToken
    return { message: 'Reset password link sent', resetToken }; // remove resetToken in production
  }

  async resetPassword(token: string, newPassword: string) {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { token: `reset_${token}`, revokedAt: null },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Reset token invalid or expired', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: stored.userId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string, shopId?: string) {
    const payload = { id: userId, email, role, shopId };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    } as jwt.SignOptions);

    const refreshTokenValue = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    } as jwt.SignOptions);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token: refreshTokenValue,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private async getSellerShopId(userId: string, role: string): Promise<string | undefined> {
    if (role !== 'SELLER_OWNER' && role !== 'SELLER_STAFF') return undefined;
    const profile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { shop: true },
    });
    return profile?.shop?.id;
  }

  private sanitizeUser(user: { id: string; email: string; role: string; status: string; createdAt: Date }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
