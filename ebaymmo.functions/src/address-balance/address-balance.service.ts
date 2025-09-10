import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectSdk, GqlSdk } from '../sdk/sdk.module';
import * as speakeasy from 'speakeasy';
import i18n from 'i18n';

@Injectable()
export class AddressBalanceService {
  constructor(@InjectSdk() private sdk: GqlSdk) {}
  async verify2FAToken(userId: string, twoFactorToken: string) {
    // 1. Lấy thông tin user và two_factor_secret
    const { users } = await this.sdk.GetUsers({
      where: { userId: { _eq: userId } },
    });

    console.log('input', twoFactorToken);

    if (!users[0]) {
      throw new UnauthorizedException('User not found');
    }

    const user = users[0];

    // 2. Tạo current token từ secret
    const currentToken = speakeasy.totp({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      digits: 6,
    });

    // 3. So sánh token
    console.error('Token Comparison:', {
      providedToken: twoFactorToken,
      currentToken: currentToken,
      match: twoFactorToken === currentToken,
    });

    if (twoFactorToken !== currentToken) {
      return {
        status: false,
        message: i18n.__('errors.invalid2FAToken'),
      };
    } else {
      return {
        status: true,
        message: i18n.__('success'),
      };
    }
  }
}
