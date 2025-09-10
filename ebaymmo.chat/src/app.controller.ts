import { Controller, Get } from '@nestjs/common';
import dayjs from 'dayjs';

@Controller()
export class AppController {
    constructor() {}

    @Get()
    home() {
        return 'OK';
    }

    @Get('api/health')
    getHealth() {
        return {
            status: 'ok',
            message: 'Service is healthy',
            timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
    }
}
