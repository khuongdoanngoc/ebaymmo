import { Injectable } from '@nestjs/common';
import { GqlSdk, InjectSdk } from 'src/sdk/sdk.module';
import { S3Service } from 'src/s3/s3.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  constructor(
    @InjectSdk() private readonly sdk: GqlSdk,
    private readonly s3Service: S3Service,
  ) {}

  async processFileContent(content: string, fileName: string) {
    try {
      const lines = content.split('\n');
      const results = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        const productItemId = uuidv4();

        try {
          const result = await this.sdk.createProductItem({
            object: {
              productItemId,
              dataText: line.trim(),
              content: fileName,
            },
          });
          results.push(result.insertProductItemsOne);
        } catch (dbError) {
          console.error('Error inserting product item:', dbError);
          throw new Error(`Failed to insert product item: ${dbError.message}`);
        }
      }

      try {
        await this.uploadFileToS3(fileName, content);
      } catch (s3Error) {
        console.error('Error uploading to S3:', s3Error);
        throw new Error(`Failed to upload file to S3: ${s3Error.message}`);
      }

      return {
        success: true,
        message: 'File processed successfully',
        items: results,
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        message: error.message || 'Failed to process file',
        error: error.message,
      };
    }
  }

  private async uploadFileToS3(fileName: string, content: string) {
    try {
      const buffer = Buffer.from(content);
      await this.s3Service.uploadFile({
        fileName,
        buffer,
        contentType: 'text/plain',
      });
    } catch (error) {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }
}
