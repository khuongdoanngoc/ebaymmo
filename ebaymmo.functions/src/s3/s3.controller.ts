import { Body, Controller, Post } from '@nestjs/common';
import { S3Service } from './s3.service';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-url')
  async getPresignedUrl(@Body() body: any) {
    const { fileName, fileExtension, userId } = body.input.input;
    console.log('userId', userId);

    const userIdString = userId.toString();
    const url = await this.s3Service.presignedUrl(userIdString, fileName, fileExtension);
    return {
      url,
    };
  }
}
