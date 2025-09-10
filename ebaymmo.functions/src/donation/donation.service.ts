import { Injectable, BadRequestException } from '@nestjs/common';
import { GqlSdk, InjectSdk } from '../sdk/sdk.module';

@Injectable()
export class DonationsService {
  constructor(@InjectSdk() private readonly sdk: GqlSdk) {}

  async donateToBlog(userId: string, blogId: string, amount: number, comment: string) {
    if (amount <= 0) {
      throw new BadRequestException('Donation amount must be greater than 0');
    }

    try {
      // Check user balance before proceeding
      const userResult = await this.sdk.GetUserInfo({
        userId: userId,
      });
      if (!userResult.users || userResult.users.length === 0) {
        throw new BadRequestException('User not found');
      }

      const userBalance = userResult.users[0].balance || 0;

      if (userBalance < amount) {
        throw new BadRequestException(
          `Insufficient balance. Current balance: ${userBalance}, Donation amount: ${amount}`,
        );
      }

      // Proceed with donation
      const response = await this.sdk.DonateToBlog({
        p_donor_id: userId,
        p_blog_id: blogId,
        p_donation_amount: amount,
        p_comment: comment,
      });
      if (!response.donateToBlog) {
        throw new Error('No donation data returned');
      }

      const donation = response.donateToBlog[0];
      return {
        success: true,
        message: 'Donation successful',
        donationId: donation.donationId,
        blogId: donation.blogId,
        userId: userId,
        amount: donation.amount,
        donationDate: donation.donationDate,
        comment: donation.comment,
        createAt: donation.createAt,
        updateAt: donation.updateAt,
      };
    } catch (error) {
      console.error('Donation failed:', error);
      return {
        success: false,
        message: `Donation failed: ${error.message}`,
        donationId: null,
        blogId: null,
        userId: null,
        amount: null,
        donationDate: null,
        comment: null,
        createAt: null,
        updateAt: null,
      };
    }
  }
}
