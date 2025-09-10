import axios, { AxiosProgressEvent } from 'axios';

/**
 * URL Configuration for API endpoints
 */
const API_URLS = {
    development:
        process.env.NEXT_PUBLIC_API_URL_DEV ||
        'http://localhost:3000/api/upload',
    production:
        process.env.NEXT_PUBLIC_API_URL_PROD ||
        'https://ebaymmo.shop/api/upload'
};

// Determine which URL to use based on environment
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const UPLOAD_URL = IS_PRODUCTION ? API_URLS.production : API_URLS.development;

/**
 * Interface for file upload response
 */
export interface FileUploadResponse {
    success: boolean;
    url?: string;
    message?: string;
    error?: string;
}

/**
 * Interface for file upload options
 */
export interface FileUploadOptions {
    /**
     * Optional additional form data fields
     */
    additionalData?: Record<string, string>;

    /**
     * Optional callback for upload progress
     */
    onProgress?: (percentage: number) => void;

    /**
     * Optional flag to force using production URL
     */
    useProductionUrl?: boolean;
}

/**
 * Uploads a file using FormData with absolute URLs
 *
 * @param file - The file to upload
 * @param options - Upload options
 * @returns Promise with the upload response
 */
export const uploadSingleFile = async (
    file: File,
    options: FileUploadOptions = {}
): Promise<FileUploadResponse> => {
    try {
        const { additionalData = {}, onProgress, useProductionUrl } = options;

        // Allow forcing production URL if needed
        const uploadUrl = useProductionUrl ? API_URLS.production : UPLOAD_URL;

        // Create FormData instance
        const formData = new FormData();

        // Append the file to FormData
        formData.append('file', file);

        // Append any additional data
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        // Make the API request with absolute URL
        const response = await axios.post(uploadUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
                ? (progressEvent: AxiosProgressEvent) => {
                      const percentage = Math.round(
                          (progressEvent.loaded * 100) /
                              (progressEvent.total || 1)
                      );
                      onProgress(percentage);
                  }
                : undefined
        });

        return {
            success: true,
            url: response.data.url,
            message: response.data.message
        };
    } catch (error: unknown) {
        console.error('File upload failed:', error);

        if (axios.isAxiosError(error) && error.response) {
            return {
                success: false,
                error: error.response.data.message || 'File upload failed'
            };
        }

        return {
            success: false,
            error: 'File upload failed'
        };
    }
};

/**
 * Uploads multiple files using FormData with absolute URLs
 *
 * @param files - Array of files to upload
 * @param options - Upload options
 * @returns Promise with array of upload responses
 */
export const uploadMultipleFiles = async (
    files: File[],
    options: FileUploadOptions = {}
): Promise<FileUploadResponse[]> => {
    try {
        const { additionalData = {}, onProgress, useProductionUrl } = options;

        // Allow forcing production URL if needed
        const uploadUrl = useProductionUrl ? API_URLS.production : UPLOAD_URL;

        // Create FormData instance
        const formData = new FormData();

        // Append all files to FormData
        files.forEach((file, index) => {
            formData.append('files', file);
        });

        // Append any additional data
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        // Make the API request with absolute URL
        const response = await axios.post(uploadUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
                ? (progressEvent: AxiosProgressEvent) => {
                      const percentage = Math.round(
                          (progressEvent.loaded * 100) /
                              (progressEvent.total || 1)
                      );
                      onProgress(percentage);
                  }
                : undefined
        });

        return response.data.results || [];
    } catch (error: unknown) {
        console.error('Multiple files upload failed:', error);

        if (axios.isAxiosError(error) && error.response) {
            return files.map(() => ({
                success: false,
                error: error.response?.data.message || 'File upload failed'
            }));
        }

        return files.map(() => ({
            success: false,
            error: 'File upload failed'
        }));
    }
};
