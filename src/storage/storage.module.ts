import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GcsStorageService } from './services/gcs-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [GcsStorageService],
  exports: [GcsStorageService],
})
export class StorageModule {}
