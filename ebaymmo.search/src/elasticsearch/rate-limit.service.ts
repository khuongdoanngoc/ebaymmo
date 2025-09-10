import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RateLimitService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async checkRateLimit(ip: string, limit: number, windowMs: number): Promise<boolean> {
    const key = `search_stats_${ip}`;
    const count = await this.cacheManager.get<number>(key);

    if (!count) {
      await this.cacheManager.set(key, 1, windowMs);
      return true;
    }

    if (count >= limit) {
      return false;
    }

    await this.cacheManager.set(key, count + 1, windowMs);
    return true;
  }
}
