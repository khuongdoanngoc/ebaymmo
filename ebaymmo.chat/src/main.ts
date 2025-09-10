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
        origin: '*', // specify the allowed origin
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: false,
    });

    await app.listen(3000);
}

bootstrap();

process.on('uncaughtException', (error, origin) => {
    console.log(i18n.__('error.uncaughtException', { error: error.message }));
    console.log(origin);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log(promise);
    console.log(
        i18n.__('error.unhandledRejection', { reason: reason as string }),
    );
});
