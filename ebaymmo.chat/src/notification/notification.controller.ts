import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('notify-all')
  @UseGuards(AdminGuard)
  async notifyAllUsers(@Request() req, @Body() body: { content: string }) {
    const adminUser = req.user;
    return this.notificationService.notifyAllUsers(adminUser, body.content);
  }

  @Post('notify-specific')
  @UseGuards(AdminGuard)
  async notifySpecificUsers(
    @Request() req,
    @Body() body: { userIds: string[]; content: string },
  ) {
    const adminUser = req.user;
    return this.notificationService.notifySpecificUsers(
      adminUser,
      body.userIds,
      body.content,
    );
  }

  @Post('notify-sellers')
  @UseGuards(AdminGuard)
  async notifySellers(@Request() req, @Body() body: { content: string }) {
    const adminUser = req.user;
    return this.notificationService.notifySellers(adminUser, body.content);
  }
} 