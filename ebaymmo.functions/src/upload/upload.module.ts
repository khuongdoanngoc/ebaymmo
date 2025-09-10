import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SdkModule } from '../sdk/sdk.module';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [SdkModule, S3Module],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
