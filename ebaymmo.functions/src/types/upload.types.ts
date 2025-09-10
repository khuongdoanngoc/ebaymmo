import Upload from 'graphql-upload/Upload.mjs';

export interface UploadFileInput {
  file: Upload; // GraphQL Upload type
  metadata?: {
    productId: string;
  };
}

export interface UploadResponse {
  success: boolean;
  url?: string;
}
