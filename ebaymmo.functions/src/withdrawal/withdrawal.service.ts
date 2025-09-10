import {
  Injectable,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GqlSdk, InjectSdk } from '../sdk/sdk.module';

@Injectable()
export class WithdrawalService {
  constructor(@InjectSdk() private readonly sdk: GqlSdk) {}

  async processWithdrawalAction(userId: string, amount: number, balanceAddress: string) {
    console.log('userId', userId);
    console.log('amount', amount);
    console.log('balanceAddress', balanceAddress);
    try {
      const response = await this.sdk.ProcessWithdrawal({
        p_amount: amount,
        p_user_id: userId,
        p_balance_address: balanceAddress,
      });
      console.log('response', response);

      const withdrawal = response.processWithdrawal[0];

      // Chuyển đổi format để khớp với schema
      return {
        withdrawalId: withdrawal.withdrawalId,
        userId: withdrawal.userId,
        amount: withdrawal.amount,
        withdrawalStatus: withdrawal.withdrawalStatus,
        requestDate: withdrawal.requestDate,
        processedDate: withdrawal.processedDate,
        description: withdrawal.description,
        createAt: withdrawal.createAt,
        updateAt: withdrawal.updateAt,
        balanceAddress: withdrawal.balanceAddress || '',
      };
    } catch (error) {
      if (error?.message?.includes('Connection failure')) {
        throw new ServiceUnavailableException(
          'Unable to connect to withdrawal service. Please try again later.',
        );
      }
      throw new InternalServerErrorException(`Withdrawal failed: ${error.message}`);
    }
  }
}
