import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../database/entities/user.entity';
import { WebAppProfileController } from './profile.controller';
import { WebAppProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [WebAppProfileController],
  providers: [WebAppProfileService],
})
export class WebAppProfileModule {}
