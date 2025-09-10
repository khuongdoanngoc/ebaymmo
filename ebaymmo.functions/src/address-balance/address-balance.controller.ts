import { Controller, Post, Body } from '@nestjs/common';
import { AddressBalanceService } from './address-balance.service';
import { HasuraActionsPayload } from '../types/hasura';

@Controller('verify')
export class AddressBalanceController {
  constructor(private readonly addressBalanceService: AddressBalanceService) {}

  @Post('2fa-code')
  async addAddressBalance(
    @Body()
    payload: HasuraActionsPayload<{
      twoFactorToken: string;
    }>,
  ) {
    const userId = payload.session_variables['x-hasura-user-id'];
    console.log('userId', userId);
    const { twoFactorToken } = payload.input;
    return this.addressBalanceService.verify2FAToken(userId, twoFactorToken);
  }
}
