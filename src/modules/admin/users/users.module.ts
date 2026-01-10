import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../../database/entities/user.entity';
import { AdminUsersController } from './users.controller';
import { AdminUsersService } from './users.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminRegularUsersModule {}
