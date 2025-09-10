import { Body, Controller, Post } from '@nestjs/common';
import { UploadService } from './upload.service';
import { HasuraActionsPayload } from 'src/types';

@Controller('product')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload-product')
  async uploadFile(
    @Body()
    payload: HasuraActionsPayload<{
      content: string;
      fileName: string;
    }>,
  ) {
    const { content, fileName } = payload.input;
    return await this.uploadService.processFileContent(content, fileName);
  }
}
