import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiFacesController } from './ai-faces.controller';
import { AiFacesService } from './ai-faces.service';
import { AiFace } from '../../../database/entities/ai-face.entity';
import { Category } from '../../../database/entities/category.entity';
import { StorageModule } from '../../../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([AiFace, Category]), StorageModule],
  controllers: [AiFacesController],
  providers: [AiFacesService],
  exports: [AiFacesService],
})
export class AiFacesModule {}
