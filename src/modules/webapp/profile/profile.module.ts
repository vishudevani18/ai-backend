import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../database/entities/user.entity';
import { UserAddress } from '../../../database/entities/user-address.entity';
import { UserBusiness } from '../../../database/entities/user-business.entity';
import { WebAppProfileController } from './profile.controller';
import { WebAppProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAddress, UserBusiness])],
  controllers: [WebAppProfileController],
  providers: [WebAppProfileService],
})
export class WebAppProfileModule {}
