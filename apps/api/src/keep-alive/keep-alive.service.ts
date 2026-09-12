import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private readonly config: ConfigService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async pingHealth() {
    const enabled =
      this.config.get<string>('KEEP_ALIVE_ENABLED', 'true') !== 'false';
    if (!enabled) return;

    const url = this.resolveHealthUrl();
    if (!url) {
      this.logger.debug(
        'Keep-alive omitido: define KEEP_ALIVE_URL o RENDER_EXTERNAL_URL',
      );
      return;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      this.logger.log(`Keep-alive ${response.status} → ${url}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Keep-alive falló: ${message}`);
    }
  }

  private resolveHealthUrl(): string | null {
    const explicit = this.config.get<string>('KEEP_ALIVE_URL')?.trim();
    if (explicit) return explicit;

    const renderUrl = this.config.get<string>('RENDER_EXTERNAL_URL')?.trim();
    if (renderUrl) {
      return `${renderUrl.replace(/\/$/, '')}/api/v1/health`;
    }

    // Solo útil en local / sin dominio público (no evita sleep en Render)
    const port = this.config.get<string>('PORT', '3001');
    return `http://127.0.0.1:${port}/api/v1/health`;
  }
}
