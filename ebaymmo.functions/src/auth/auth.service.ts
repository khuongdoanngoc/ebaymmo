import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';
import { LoginResponse } from 'src/sdk/sdk';
import { JwtService } from '@nestjs/jwt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import i18n from 'i18n';
import * as bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

interface UserResponse {
  userId: string;
  email: string;
  username?: string;
  password?: string;
  fullName?: string;
}

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectSdk() private sdk: GqlSdk,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  public async handleRegister(email: string, password: string, username: string) {
    if (!email || !password || !username) {
      throw new InternalServerErrorException('Missing required fields');
    }

    // Kiểm tra email đã tồn tại
    const { users } = await this.sdk.GetUsers({
      where: { email: { _eq: email } },
    });

    if (users.length > 0) {
      throw new ConflictException('Email already exists');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Tạo ID và username cho user mới
    const user_id = uuidv4();

    // Chèn user vào Hasura
    await this.sdk.CreateUser({
      object: {
        userId: user_id,
        email,
        password: hashedPassword,
        username,
      },
    });
    await this.mailService.sendRegistrationEmail(email);
    return {
      message: 'register success',
    };
  }

  public async handleLogin(email: string, password: string): Promise<LoginResponse> {
    if (!email || !password) {
      throw new UnauthorizedException(i18n.__('errors.missingCredentials'));
    }
    const { users } = await this.sdk.GetUserByEmailForLogin({
      email: email,
    });

    if (!users[0]) {
      throw new UnauthorizedException(i18n.__('errors.userNotFound'));
    }
    const isPasswordValid = await bcryptjs.compare(password, users[0].password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(i18n.__('errors.invalidPassword'));
    }

    const { accessToken, refreshToken } = await this.generateToken(users[0]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateToken(user: any) {
    try {
      const refreshToken = this.createRefreshToken(user);
      const userRole = user.role || 'USER';
      const accessToken = this.createAccessToken(refreshToken, userRole);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new UnauthorizedException(i18n.__('errors.failedToGenerateTokens'));
    }
  }

  getJwtSecret = () => {
    const { key, type } = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET);
    return { jwtSecret: key, algorithm: type };
  };

  createToken = (payload: object, expiresIn: string) => {
    const { jwtSecret, algorithm } = this.getJwtSecret();
    return jwt.sign(payload, jwtSecret, {
      algorithm: algorithm,
      expiresIn: expiresIn,
    });
  };

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const { key } = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET);
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: key,
      });

      const { accessToken, refreshToken: newRefreshToken } = this.generateToken(payload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException(i18n.__('errors.invalidOrExpiredRefreshToken'));
    }
  }

  createAccessToken = (refreshToken: string, role: string) => {
    const { jwtSecret, algorithm } = this.getJwtSecret();
    try {
      const payload = jwt.verify(refreshToken, jwtSecret, {
        algorithms: [algorithm],
      }) as JwtPayload;

      const hasuraClaims = {
        'https://hasura.io/jwt/claims': {
          'x-hasura-default-role': role.toLowerCase(),
          'x-hasura-allowed-roles': [role.toLowerCase()],
          'X-Hasura-User-Id': String(payload.userId),
        },
      };

      return this.createToken(hasuraClaims, '1d');
    } catch (error) {
      throw new UnauthorizedException(i18n.__('errors.failedToCreateAccessToken'));
    }
  };

  createAccessTokenOperator = (refreshToken: string, role: string) => {
    const { jwtSecret, algorithm } = this.getJwtSecret();
    try {
      const payload = jwt.verify(refreshToken, jwtSecret, {
        algorithms: [algorithm],
      }) as JwtPayload;

      const hasuraClaims = {
        'https://hasura.io/jwt/claims': {
          'x-hasura-default-role': role.toLowerCase(),
          'x-hasura-allowed-roles': [role.toLowerCase()],
          'X-Hasura-User-Id': String(payload.userId),
        },
      };

      return this.createToken(hasuraClaims, '1d');
    } catch (error) {
      throw new UnauthorizedException(i18n.__('errors.failedToCreateAccessToken'));
    }
  };

  createRefreshToken = (user: { userId: string }) => {
    try {
      return this.createToken({ userId: user.userId }, '10d');
    } catch (error) {
      throw new UnauthorizedException(i18n.__('errors.failedToCreateRefreshToken'));
    }
  };

  async validateGoogleUser(userData: any): Promise<LoginResponse> {
    console.log('userData', userData);
    const { email, sub: googleId, name } = userData.profile;

    if (!email || !googleId) {
      throw new UnauthorizedException('Missing Google profile information');
    }

    const { users } = await this.sdk.GetUserByEmail({
      email: email,
    });

    let user;

    if (!users[0]) {
      const result = await this.sdk.CreateUser({
        object: {
          userId: uuidv4(),
          email: email,
          password: '',
          googleAccountId: googleId,
          role: 'USER',
          username: email.split('@')[0],
          fullName: name,
          images: userData.profile.images || '',
        },
      });

      if (!result.insertUsersOne) {
        throw new UnauthorizedException('Failed to create user');
      }
      user = result.insertUsersOne;
    } else {
      user = users[0];
    }
    console.log('user', user);

    const { accessToken, refreshToken } = this.generateToken(user);

    return {
      accessToken,
      refreshToken,
    };
  }

  async handleForgotPassword(email: string) {
    try {
      const { users } = await this.sdk.GetUserByEmail({
        email: email,
      });

      if (!users.length) {
        return {
          success: false,
          message: i18n.__('errors.userNotFound'),
        };
      }

      // fix here
      const { key, type } = JSON.parse(process.env.RESET_PASSWORD_JWT_SECRET);
      const token = jwt.sign({ email: email }, key, {
        algorithm: type,
        expiresIn: '1h',
      });

      await this.mailService.sendResetPasswordEmail(email, token);
      return {
        success: true,
        message: i18n.__('messages.resetPasswordEmailSent'),
      };
    } catch (error) {
      console.error('Forgot Password Error: ', error);
      return {
        success: false,
        message: i18n.__('errors.resetPasswordFailed'),
      };
    }
  }

  async handleResetPassword(body: { newPassword: string; token: string }) {
    try {
      if (!body.newPassword || !body.token) {
        throw new InternalServerErrorException('Missing required fields');
      }

      const decoded: any = this.verifyToken(body.token);
      if (!decoded) {
        throw new ForbiddenException('Token invalid!');
      }
      const hashedPassword = await bcryptjs.hash(body.newPassword, 10);

      const response = await this.sdk.ResetPasswordByEmail({
        email: decoded.email,
        hashedPassword,
      });

      if (response.updateUsers.returning.length === 0) {
        return {
          success: false,
          message: i18n.__('errors.userNotFound'),
        };
      }

      return {
        success: true,
        message: i18n.__('messages.resetPasswordSuccess'),
      };
    } catch (error) {
      console.log(error.response.message);
      return {
        success: false,
        message: i18n.__('errors.resetPasswordVerifyFailed'),
        error: error?.response?.message || error?.message || 'Unknown error',
      };
    }
  }

  verifyToken = (token: string) => {
    try {
      const { key, type } = JSON.parse(process.env.RESET_PASSWORD_JWT_SECRET);
      return jwt.verify(token, key);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired!');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new ForbiddenException('Token invalid!');
      } else {
        throw new UnauthorizedException('Unable to verify token!');
      }
    }
  };

  //change password function
  async changePassword(token: string, oldPassword: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new UnauthorizedException('Missing token or new password');
    }

    // Decode token
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedException('Invalid token');
    }
    const userId = decoded.userId;

    const { users } = await this.sdk.GetUsers({
      where: { userId: { _eq: userId } },
      offset: 0,
    });

    if (!users.length) {
      throw new BadRequestException('User not found');
    }

    const user = users[0];

    // Check old password
    if (user.password) {
      const isPasswordMatch = await bcryptjs.compare(oldPassword, user.password);
      if (!isPasswordMatch) {
        throw new BadRequestException('Old password is incorrect');
      }
      if (oldPassword === newPassword) {
        throw new BadRequestException('New password cannot be the same as old password');
      }
    }

    // hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // change password
    const { updateUsers } = await this.sdk.changeUserPassword({
      userId: userId,
      newPassword: hashedPassword,
    });

    if (updateUsers.affectedRows === 0) {
      throw new BadRequestException('Password update failed');
    }

    return { message: 'Password changed successfully', success: true };
  }

  async handleContactEmail({
    email,
    phone,
    need,
    content,
  }: {
    email: string;
    phone: string;
    need: string;
    content: string;
  }) {
    try {
      // const { users } = await this.sdk.GetUserByEmail({
      //   email: email,
      // });

      // if (!users.length) {
      //   return {
      //     success: false,
      //     message: i18n.__('errors.userNotFound'),
      //   };
      // }

      // // Validate dữ liệu đầu vào
      // if (!email || !phone || !need || !content) {
      //   return {
      //     success: false,
      //     message: i18n.__('errors.missingFields'),
      //   };
      // }

      // Gửi email thông qua MailService
      await this.mailService.sendContactEmail(email, phone, need, content);

      return {
        success: true,
        message: i18n.__('messages.contactEmailSent'),
      };
    } catch (error) {
      console.error('Contact Email Error: ', error);
      return {
        success: false,
        message: i18n.__('Contact sent successfully'),
      };
    }
  }

  public async enable2FA(userId: string) {
    const secret = speakeasy.generateSecret({ length: 20 });
    const { users } = await this.sdk.GetUsers({
      where: { userId: { _eq: userId } },
    });

    await this.sdk.UpdateUser({
      pkColumns: { userId },
      _set: {
        twoFactorSecret: secret.base32,
        twoFactorEnabled: false,
      },
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  public async verify2FAToken(userId: string, token: string): Promise<boolean> {
    const { users } = await this.sdk.GetUsers({
      where: { userId: { _eq: userId } },
    });

    // check user có tồn tại và chưa bật 2FA
    if (!users[0] || users[0].twoFactorEnabled) {
      throw new UnauthorizedException(i18n.__('errors.2faNotEnabled'));
    }

    const verified = speakeasy.totp.verify({
      secret: users[0].twoFactorSecret, // Sửa: dùng twoFactorSecret thay vì twoFactorEnabled
      encoding: 'base32',
      token,
    });

    console.log('verified', verified);
    if (!verified) {
      throw new UnauthorizedException(i18n.__('errors.invalid2FAToken'));
    }

    await this.sdk.UpdateUser({
      pkColumns: { userId },
      _set: { twoFactorEnabled: true },
    });

    return true;
  }

  // public async tool2fa(userId: string, token: string) {
  //   const { users } = await this.sdk.GetUsers({
  //     where: { userId: { _eq: userId } },
  //   });

  //   console.log('users', users);
  // }

  //login operator
  public async handleOperatorLogin(email: string, password: string): Promise<LoginResponse> {
    if (!email || !password) {
      throw new UnauthorizedException(i18n.__('errors.missingCredentials'));
    }

    const { users } = await this.sdk.GetUserByEmailForLogin({
      email: email,
    });

    if (!users[0]) {
      throw new UnauthorizedException(i18n.__('errors.userNotFound'));
    }

    // Check if user is an operator
    if (users[0].role !== 'OPERATOR') {
      throw new ForbiddenException('Access denied. Operator role required.');
    }

    const isPasswordValid = await bcryptjs.compare(password, users[0].password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(i18n.__('errors.invalidPassword'));
    }

    const { accessToken, refreshToken } = await this.generateTokenOperator(users[0]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateTokenOperator(user: any) {
    const refreshToken = this.createRefreshToken(user);
    const userRole = user.role || 'OPERATOR';
    const accessToken = this.createAccessTokenOperator(refreshToken, userRole);
    return { accessToken, refreshToken };
  }
  catch(error) {
    throw new UnauthorizedException(i18n.__('errors.failedToGenerateTokens'));
  }

  async refreshOperator(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const { key } = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET);
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: key,
      });

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokenOperator(payload);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (e) {
      throw new UnauthorizedException(i18n.__('errors.invalidOrExpiredRefreshToken'));
    }
  }
}
