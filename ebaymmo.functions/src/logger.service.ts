import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { S3StreamLogger } from 's3-streamlogger';
import * as dotenv from 'dotenv';
import dayjs from 'dayjs';
dotenv.config();

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;
  private context?: string;

  constructor() {
    const logFormat = winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]${this.context ? ' [' + this.context + ']' : ''}: ${message}`;
    });

    const s3Transport = new winston.transports.Stream({
      stream: new S3StreamLogger({
        config: {
          endpoint: `https://sgp1.digitaloceanspaces.com`,
        },
        bucket: `${process.env.DO_SPACES_NAME}`,
        access_key_id: process.env.DO_SPACES_ACCESS_KEY,
        secret_access_key: process.env.DO_SPACES_SECRET_KEY,
        region: 'ap-southeast-1', // Singapore region
        folder: `${process.env.PROJECT_NAME}/functions-logs`,
        name_format: `${dayjs().format('YYYYMMDD')}.log`,
        date_format: 'YYYYMMDD',
      }),
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        logFormat,
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
        s3Transport,
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(...message: any[]) {
    this.logger.error(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
