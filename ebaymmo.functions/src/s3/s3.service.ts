import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutBucketPolicyCommand,
  GetBucketPolicyCommand,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InjectSdk } from 'src/sdk/sdk.module';
import { GqlSdk } from 'src/sdk/sdk.module';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor(@InjectSdk() private readonly sdk: GqlSdk) {
    const region = process.env.DO_SPACES_REGION || 'sgp1';
    const endpoint = `https://${region}.digitaloceanspaces.com`;

    this.s3 = new S3Client({
      endpoint,
      region,
      forcePathStyle: false,
      credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
      },
    });
  }

  async onModuleInit() {
    await this.setPublicReadPolicyForFolder(process.env.DO_SPACES_NAME, 'proxy-s3');
    await this.setCorsPolicy(process.env.DO_SPACES_NAME);
  }

  async setPublicReadPolicyForFolder(bucketName: string, folderPath: string) {
    // Kiểm tra chính sách hiện tại của bucket
    const currentPolicyCommand = new GetBucketPolicyCommand({
      Bucket: bucketName,
    });
    try {
      const currentPolicyResponse = await this.s3.send(currentPolicyCommand);
      const currentPolicy = JSON.parse(currentPolicyResponse.Policy || '{}');

      // Kiểm tra xem chính sách đã cho phép truy cập công khai chưa
      const isPublic = currentPolicy.Statement.some(
        statement =>
          statement.Effect === 'Allow' &&
          statement.Principal === '*' &&
          statement.Action === 's3:GetObject' &&
          statement.Resource === `arn:aws:s3:::${bucketName}/${folderPath}/*`,
      );

      if (isPublic) {
        console.log('Bucket policy is already public, skipping set.');
        return; // Nếu đã công khai, bỏ qua việc thiết lập
      }
    } catch (error) {
      console.error('Error checking current bucket policy', error);
    }

    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${bucketName}/${folderPath}/*`,
        },
      ],
    };

    const command = new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(policy),
    });

    try {
      const response = await this.s3.send(command);
      console.log('Bucket policy set successfully', response);
    } catch (error) {
      console.error('Error setting bucket policy', error);
    }
  }

  async setCorsPolicy(bucketName: string) {
    const corsConfig = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000,
        },
      ],
    };

    try {
      const command = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: corsConfig,
      });

      await this.s3.send(command);
      console.log('CORS policy set successfully');
    } catch (error) {
      console.error('Error setting CORS policy:', error);
      throw error;
    }
  }

  getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      mkv: 'video/x-matroska',
      m4v: 'video/mp4',
      '3gp': 'video/3gpp',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  };

  async getPresignedUrl(agencyName: string, fileName: string, fileExtension: string) {
    const contentType = this.getMimeType(fileExtension);

    const sanitizedAgencyName = agencyName.replace(/[^a-zA-Z0-9]/g, '_');
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_NAME as string,
      Key: `proxy-s3/${sanitizedAgencyName}/${fileName}.${fileExtension}`,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 });

    return url;
  }

  async presignedUrl(userId: string, fileName: string, fileExtension: string) {
    try {
      const { users } = await this.sdk.GetUserInfo({
        userId: userId,
      });

      if (users.length === 0) {
        throw new Error('invalid user');
      }
      const user = users[0];
      return this.getPresignedUrl(user.email, fileName, fileExtension);
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('invalid user');
    }
  }

  async uploadFile({
    fileName,
    buffer,
    contentType = 'text/plain',
  }: {
    fileName: string;
    buffer: Buffer;
    contentType?: string;
  }) {
    const command = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_NAME as string,
      Key: `proxy-s3/${fileName}`,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });

    try {
      await this.s3.send(command);
      return {
        success: true,
        url: `https://${process.env.DO_SPACES_NAME}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/proxy-s3/${fileName}`,
      };
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
}
