import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlSdk, InjectSdk } from '../sdk/sdk.module';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf;

  constructor(
    private readonly configService: ConfigService,
    @InjectSdk() private readonly sdk: GqlSdk,
  ) {
    console.log('=== Telegram Service Initialization ===');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured in .env');
    }

    this.bot = new Telegraf(botToken);
    console.log('=== Telegram Service Initialized ===');
  }

  async onModuleInit() {
    // Setup bot commands
    this.setupCommands();

    // Start bot with polling
    await this.startBot();
  }

  private setupCommands() {
    // Command handlers
    this.bot.command('start', async ctx => {
      console.log('Received /start command from:', ctx.from);
      const telegramId = ctx.from.id.toString();
      const username = ctx.from.username;
      const firstName = ctx.from.first_name;
      const lastName = ctx.from.last_name;

      // Get referral code from deep link or command parameter
      const messageText = ctx.message.text || '';
      const startPayload = messageText.split(' ')[1];
      console.log('Start payload:', startPayload);

      if (startPayload) {
        try {
          // Kiểm tra cả telegramId và referralCode
          const [existingTelegramUser, existingReferral] = await Promise.all([
            this.sdk.GetTelegramConnectionByTelegramId({
              telegramId: telegramId,
            }),
            this.sdk.GetTelegramConnectionByReferralCode({
              referralCode: startPayload,
            }),
          ]);

          if (
            existingTelegramUser.telegramConnections.length > 0 ||
            existingReferral.telegramConnections.length > 0
          ) {
            await ctx.reply(`This Telegram account or referral code has already been connected to Shop3.
If you need assistance, please contact our support team.`);
            return; // Dừng lại nếu đã tồn tại
          }

          // Nếu chưa tồn tại, thực hiện insert
          const result = await this.sdk.InsertTelegramConnection({
            object: {
              telegramId: telegramId,
              referralCode: startPayload,
              telegramUsername: username,
              telegramFirstName: firstName,
              telegramLastName: lastName,
              createdAt: new Date().toISOString(),
            },
          });

          await ctx.reply(`Welcome to Shop3! 
Your referral code: ${startPayload}
Please complete the connection process on our website.`);

          console.log('Saved referral:', result);
        } catch (error) {
          console.error('Error saving referral:', error);
          await ctx.reply(
            'An error occurred while processing your request. Please try again later.',
          );
        }
      } else {
        await ctx.reply(
          `Welcome to Shop3! Please use a valid referral code with the /start + ReffalCode command.`,
        );
      }
    });

    this.bot.command('help', ctx => {
      ctx.reply(
        'Available commands:\n/start <referral_code> - Start the bot with referral code\n/help - Show this help message',
      );
    });

    // Message handlers
    this.bot.on(message('text'), async ctx => {
      console.log('Received message:', ctx.message);
      await ctx.reply('I received your message: ' + ctx.message.text);
    });

    // Error handler
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err);
      ctx.reply('Oops! Something went wrong.');
    });
  }

  private async startBot() {
    try {
      // Start polling
      this.bot.launch();
      console.log('Bot started in polling mode');
      // Enable graceful stop
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  }
}
