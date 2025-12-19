import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsStorageService {
  private readonly logger = new Logger(GcsStorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly cdnBaseUrl: string;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('app.storage.gcs.projectId');
    const keyFilename = this.configService.get<string>('app.storage.gcs.keyFilename');
    this.bucketName = this.configService.get<string>('app.storage.gcs.bucketName');
    this.cdnBaseUrl = this.configService.get<string>('app.storage.gcs.cdnBaseUrl');

    try {
      this.storage = new Storage({
        projectId,
        keyFilename: keyFilename || undefined,
      });
    } catch (error) {
      this.logger.error('Failed to initialize GCS client', error);
      throw new Error('GCS initialization failed');
    }
  }

  /**
   * Upload a file to GCS with public-read ACL
   * @param buffer File buffer
   * @param path GCS path (e.g., 'product-backgrounds/{id}/image.jpg')
   * @param mimetype MIME type of the file
   * @returns Public CDN URL
   */
  async uploadFile(buffer: Buffer, path: string, mimetype: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(path);

      await file.save(buffer, {
        metadata: {
          contentType: mimetype,
        },
        public: true, // Make file publicly readable
      });

      // Generate public CDN URL
      const publicUrl = `${this.cdnBaseUrl}/${this.bucketName}/${path}`;
      this.logger.log(`File uploaded successfully: ${path}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(`Failed to upload file to GCS: ${path}`, error);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from GCS
   * @param path GCS path to delete
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(path);
      await file.delete();
      this.logger.log(`File deleted successfully: ${path}`);
    } catch (error) {
      // If file doesn't exist, that's okay
      if (error.code === 404) {
        this.logger.warn(`File not found for deletion: ${path}`);
        return;
      }
      this.logger.error(`Failed to delete file from GCS: ${path}`, error);
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Generate CDN URL for a file path
   * @param path GCS path
   * @returns Public CDN URL
   */
  getFileUrl(path: string): string {
    return `${this.cdnBaseUrl}/${this.bucketName}/${path}`;
  }

  /**
   * Extract GCS path from CDN URL
   * @param url CDN URL
   * @returns GCS path
   */
  extractPathFromUrl(url: string): string {
    const baseUrl = `${this.cdnBaseUrl}/${this.bucketName}/`;
    if (url.startsWith(baseUrl)) {
      return url.replace(baseUrl, '');
    }
    return url;
  }
}

