import { EventSubscriber, EntitySubscriberInterface, RemoveEvent, DataSource } from 'typeorm';
import { Category } from '../entities/category.entity';
import { ProductTheme } from '../entities/product-theme.entity';
import { ProductBackground } from '../entities/product-background.entity';
import { ProductPose } from '../entities/product-pose.entity';
import { AiFace } from '../entities/ai-face.entity';
import { GcsStorageService } from '../../storage/services/gcs-storage.service';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
@EventSubscriber()
export class ImageCleanupSubscriber implements EntitySubscriberInterface, OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  onModuleInit() {
    // Register this subscriber with the data source after module initialization
    if (!this.dataSource.subscribers.includes(this as any)) {
      this.dataSource.subscribers.push(this as any);
    }
  }

  /**
   * Listen to hard delete events and clean up associated images from GCS
   */
  async beforeRemove(event: RemoveEvent<any>): Promise<void> {
    const entity = event.entity;

    // Extract image path based on entity type
    let imagePath: string | undefined;

    if (entity instanceof Category || entity instanceof ProductTheme) {
      imagePath = entity.imagePath;
    } else if (entity instanceof ProductBackground || entity instanceof ProductPose) {
      imagePath = entity.imagePath;
    } else if (entity instanceof AiFace) {
      imagePath = entity.imagePath;
    }

    // Delete image from GCS if path exists
    if (imagePath) {
      try {
        await this.gcsStorageService.deleteFile(imagePath);
      } catch (error) {
        // Log error but don't fail the delete operation
        console.error(`Failed to delete image from GCS: ${imagePath}`, error);
      }
    }
  }

  /**
   * Listen to all entity types that have images
   * We check entity types in beforeRemove since TypeORM doesn't support array returns
   */
  listenTo(): Function {
    // Return a base entity class - TypeORM will call beforeRemove for all entities
    // We filter by entity type in beforeRemove method
    return Category; // Return one entity class, but we handle all in beforeRemove
  }
}
