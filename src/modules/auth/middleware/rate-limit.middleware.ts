import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RATE_LIMITING_CONFIG } from '../../../config/jwt.config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private attempts = new Map<string, Array<number>>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.path;

    let limit = RATE_LIMITING_CONFIG.REFRESH_TOKEN_LIMIT;
    let windowMinutes = RATE_LIMITING_CONFIG.REFRESH_TOKEN_WINDOW_MINUTES;

    if (endpoint.includes('/login')) {
      limit = RATE_LIMITING_CONFIG.LOGIN_LIMIT;
      windowMinutes = RATE_LIMITING_CONFIG.LOGIN_WINDOW_MINUTES;
    } else if (endpoint.includes('/forgot-password')) {
      limit = RATE_LIMITING_CONFIG.FORGOT_PASSWORD_LIMIT;
      windowMinutes = RATE_LIMITING_CONFIG.FORGOT_PASSWORD_WINDOW_MINUTES;
    }

    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const key = `${ip}:${endpoint}`;

    let requestTimes = this.attempts.get(key) || [];

    requestTimes = requestTimes.filter(time => now - time < windowMs);

    if (requestTimes.length >= limit) {
      throw new HttpException(
        `Too many requests from ${ip}. Please try again later.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    requestTimes.push(now);
    this.attempts.set(key, requestTimes);

    if (Math.random() < 0.1) {
      this.cleanupOldAttempts(now);
    }

    next();
  }

  private cleanupOldAttempts(now: number) {
    const windowMs = 60 * 60 * 1000;

    for (const [key, times] of this.attempts.entries()) {
      const recentTimes = times.filter(time => now - time < windowMs);
      
      if (recentTimes.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recentTimes);
      }
    }
  }
}
