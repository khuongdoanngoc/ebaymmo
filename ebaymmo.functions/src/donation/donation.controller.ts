import { Controller, Post, Body } from '@nestjs/common';
import { HasuraActionsPayload } from '../types/hasura';
import { DonationsService } from './donation.service';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post('donate-blog')
  async donateToBlogAction(
    @Body() body: HasuraActionsPayload<{ blogId: string; donationAmount: number; comment: string }>,
  ) {
    const userId = body.session_variables['x-hasura-user-id'];
    return this.donationsService.donateToBlog(
      userId,
      body.input.blogId,
      body.input.donationAmount,
      body.input.comment,
    );
  }
}
