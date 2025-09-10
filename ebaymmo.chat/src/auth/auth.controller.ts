import { Body, Controller, Get, Post, UseGuards, Query } from '@nestjs/common';
import { ApiKeyGuard } from './guards/api-key.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(ApiKeyGuard)
    @Post('/upsert-user')
    async upsertUser(@Body() body) {
        return this.authService.handleUpsertUser(body);
    }

    @Get('/search-user')
    async searchUser(@Query() query) {
        return this.authService.handleSearchUser(query);
    }
}
