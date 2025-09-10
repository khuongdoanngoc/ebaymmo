import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import i18n from 'i18n';

// Cấu hình i18n
i18n.configure({
  locales: ['en', 'vi'], // Các ngôn ngữ hỗ trợ
  directory: './src/locales', // Thư mục chứa các file ngôn ngữ
  defaultLocale: 'en',
  objectNotation: true,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
  });

  process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
  });
  // Thêm middleware để lấy ngôn ngữ từ header
  app.use((req, res, next) => {
    const lang =
      req.headers['content-language'] ||
      req.headers['Content-Language'] ||
      req.headers['accept-language']?.split(',')[0] ||
      req.headers['Accept-Language']?.split(',')[0] ||
      'en';
    i18n.setLocale(lang);
    next();
  });

  // Thêm cấu hình CORS
  app.enableCors({
    origin: '*', // Cho phép tất cả các origin trong môi trường phát triển
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  await app.listen(process.env.PORT || 3000);
}

bootstrap();

process.on('uncaughtException', (error, origin) => {
  console.log('----- Uncaught exception -----');
  console.log(i18n.__('error.uncaughtException', { error: error.message }));
  console.log('----- Exception origin -----');
  console.log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('----- Unhandled Rejection at -----');
  console.log(promise);
  console.log('----- Reason -----');
  console.log(i18n.__('error.unhandledRejection', { reason: reason as string }));
});
