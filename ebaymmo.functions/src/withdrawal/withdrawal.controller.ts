import { Controller, Post, Body } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { HasuraActionsPayload } from '../types/hasura';

@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post()
  async processWithdrawal(
    @Body() body: HasuraActionsPayload<{ amount: number; balanceAddress: string }>,
  ) {
    const userId = body.session_variables['x-hasura-user-id']; // Lấy từ context hoặc request
    return this.withdrawalService.processWithdrawalAction(
      userId,
      body.input.amount,
      body.input.balanceAddress,
    );
  }
}
