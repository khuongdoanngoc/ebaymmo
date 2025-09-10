import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter } from 'nodemailer';
import * as nodemailer from 'nodemailer';
import { sendMailDto } from 'src/dto/mail.dto';

@Injectable()
export class MailService {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const resetPasswordUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    const mailData: sendMailDto = {
      recipients: [email],
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              background-color: #28a745;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 10px;
            }
            .content {
              padding: 20px;
              border: 1px solid #e0e0e0;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              background-color: #28a745;
              color: white;
              text-decoration: none;
              padding: 12px 25px;
              border-radius: 4px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #888888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://i.imgur.com/sbAiQTW.png" alt="Logo" class="logo">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center;">
                <a href="${resetPasswordUrl}" class="button">Reset Password</a>
              </p>
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; font-size: 14px; color: #666666;">${resetPasswordUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Reset your password by clicking: ${resetPasswordUrl}`, // Optional plain text version
    };
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: mailData.recipients,
        subject: mailData.subject,
        html: mailData.html,
        text: mailData.text,
      });
      console.log('Reset password email sent successfully');
    } catch (error) {
      console.error('Error sending reset password email:', error);
    }
  }
  async sendContactEmail(
    email: string,
    phone: string,
    need: string,
    content: string,
  ): Promise<void> {
    console.log(this.configService.get<string>('SMTP_USER'));
    const mailData: sendMailDto = {
      recipients: [this.configService.get<string>('SMTP_USER')],
      subject: `Contact Form: Tư vấn ${need}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Message</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              background-color: #28a745;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 10px;
            }
            .content {
              padding: 20px;
              border: 1px solid #e0e0e0;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .info-item {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eeeeee;
            }
            .label {
              font-weight: bold;
              color: #28a745;
              display: inline-block;
              width: 140px;
            }
            .message-content {
              background-color: #f0f9f2;
              padding: 15px;
              border-radius: 4px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #888888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://i.imgur.com/sbAiQTW.png" alt="Logo" class="logo">
              <h2>New Contact Message</h2>
            </div>
            <div class="content">
              <div class="info-item">
                <span class="label">From:</span> ${email}
              </div>
              <div class="info-item">
                <span class="label">Phone:</span> ${phone}
              </div>
              <div class="info-item">
                <span class="label">Consulting Need:</span> ${need}
              </div>
              <div>
                <p><strong>Message:</strong></p>
                <div class="message-content">
                  ${content}
                </div>
              </div>
            </div>
            <div class="footer">
              <p>Customer contact via website form</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `New contact message\nFrom: ${email}\nPhone: ${phone}\nConsulting Need: ${need}\nMessage: ${content}`,
    };
    try {
      const response = await this.transporter.sendMail({
        from: email,
        to: mailData.recipients,
        subject: mailData.subject,
        html: mailData.html,
        text: mailData.text,
      });
      console.log('Contact email sent successfully');
    } catch (error) {
      console.error('Error sending contact email:', error.message);
      throw error;
    }
  }
  async sendRegistrationEmail(email: string): Promise<void> {
    const loginUrl = `${this.configService.get('FRONTEND_URL')}/login`;
    const mailData: sendMailDto = {
      recipients: [email],
      subject: 'Welcome to Our Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Our Platform</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              color: #333333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              background-color: #28a745;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 10px;
            }
            .content {
              padding: 20px;
              border: 1px solid #e0e0e0;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              background-color: #28a745;
              color: white;
              text-decoration: none;
              padding: 12px 25px;
              border-radius: 4px;
              margin: 20px 0;
              font-weight: bold;
            }
            .tips {
              background-color: #f0f9f2;
              padding: 15px;
              border-radius: 4px;
              margin-top: 20px;
            }
            .tips h3 {
              margin-top: 0;
              color: #28a745;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #888888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://i.imgur.com/sbAiQTW.png" alt="Logo" class="logo">
              <h1>Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for registering with our platform. Your account has been successfully created.</p>
              <p style="text-align: center;">
                <a href="${loginUrl}" class="button">Login to Your Account</a>
              </p>
              <div class="tips">
                <h3>Getting Started</h3>
                <ul>
                  <li>Update your profile</li>
                  <li>Explore our features</li>
                  <li>Check out our documentation</li>
                </ul>
              </div>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>© 2023 Our Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to our platform! You can login at: ${loginUrl}`, // Plain text version
    };

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to: mailData.recipients,
        subject: mailData.subject,
        html: mailData.html,
        text: mailData.text,
      });
      console.log('Registration email sent successfully');
    } catch (error) {
      console.error('Error sending registration email:', error);
    }
  }
}
