import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../../database/entities/user.entity';
import { UserAddress } from '../../../database/entities/user-address.entity';
import { UserBusiness } from '../../../database/entities/user-business.entity';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';
import { BCRYPT_SALT_ROUNDS, DEFAULT_ADDRESS_COUNTRY } from '../../../common/constants/auth.constants';
import { ProfileDto } from '../../auth/dto/profile.dto';

@Injectable()
export class WebAppProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserAddress)
    private addressRepository: Repository<UserAddress>,
    @InjectRepository(UserBusiness)
    private businessRepository: Repository<UserBusiness>,
  ) {}

  async getProfile(userId: string): Promise<ProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['addresses', 'business'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get the default address (single object, same as business)
    const defaultAddress = user.addresses?.find(
      (addr) => addr.addressType === 'default',
    );

    // Transform address to AddressDto format (single object)
    const addressDto = defaultAddress
      ? {
          addressType: defaultAddress.addressType,
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipcode: defaultAddress.zipcode,
          country: defaultAddress.country,
        }
      : undefined;

    // Transform business to BusinessDto format
    const businessDto = user.business
      ? {
          businessName: user.business.businessName,
          businessType: user.business.businessType,
          businessSegment: user.business.businessSegment,
          businessDescription: user.business.businessDescription,
          gstNumber: user.business.gstNumber,
          websiteUrl: user.business.websiteUrl,
          businessLogo: user.business.businessLogo,
        }
      : undefined;

    return new ProfileDto({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      address: addressDto,
      business: businessDto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<ProfileDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['addresses', 'business'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update basic user fields (firstName, lastName)
    // Note: email is not updatable via this endpoint for security reasons (ignored if provided)
    if (updateUserDto.firstName !== undefined) {
      user.firstName = updateUserDto.firstName;
    }
    if (updateUserDto.lastName !== undefined) {
      user.lastName = updateUserDto.lastName;
    }
    // Email is intentionally ignored for security reasons

    // Update address if provided and has at least one field
    if (updateUserDto.address) {
      const hasAddressFields = Object.values(updateUserDto.address).some(
        (value) => value !== undefined && value !== null && value !== '',
      );

      if (hasAddressFields) {
        // Find existing default address - UPDATE existing, don't create duplicate
        let defaultAddress = user.addresses?.find(
          (addr) => addr.addressType === 'default',
        );

        if (defaultAddress) {
          // UPDATE existing address record
          // Update address fields
          if (updateUserDto.address.addressType !== undefined) {
            defaultAddress.addressType = updateUserDto.address.addressType;
          }
          if (updateUserDto.address.street !== undefined) {
            defaultAddress.street = updateUserDto.address.street || null;
          }
          if (updateUserDto.address.city !== undefined) {
            defaultAddress.city = updateUserDto.address.city || null;
          }
          if (updateUserDto.address.state !== undefined) {
            defaultAddress.state = updateUserDto.address.state || null;
          }
          if (updateUserDto.address.zipcode !== undefined) {
            defaultAddress.zipcode = updateUserDto.address.zipcode || null;
          }
          if (updateUserDto.address.country !== undefined) {
            defaultAddress.country = updateUserDto.address.country || DEFAULT_ADDRESS_COUNTRY;
          }

          // Save will UPDATE because entity has ID
          await this.addressRepository.save(defaultAddress);
        } else {
          // CREATE new address only if none exists
          const newAddress = this.addressRepository.create({
            userId: user.id,
            addressType: updateUserDto.address.addressType || 'default',
            street: updateUserDto.address.street || null,
            city: updateUserDto.address.city || null,
            state: updateUserDto.address.state || null,
            zipcode: updateUserDto.address.zipcode || null,
            country: updateUserDto.address.country || DEFAULT_ADDRESS_COUNTRY,
          });

          // Save will INSERT because entity has no ID
          await this.addressRepository.save(newAddress);
        }
      }
    }

    // Update business if provided
    if (updateUserDto.business) {
      // Check if at least one field has a non-empty value
      const hasBusinessFields = Object.values(updateUserDto.business).some(
        (value) => value !== undefined && value !== null && value !== '',
      );

      // If business exists, always allow updates (even if clearing fields)
      // If business doesn't exist, only create if at least one field has a value
      if (user.business) {
        // UPDATE existing business record - don't create duplicate
        // Update business fields
        if (updateUserDto.business.businessName !== undefined) {
          user.business.businessName = updateUserDto.business.businessName || null;
        }
        if (updateUserDto.business.businessType !== undefined) {
          user.business.businessType = updateUserDto.business.businessType || null;
        }
        if (updateUserDto.business.businessSegment !== undefined) {
          user.business.businessSegment = updateUserDto.business.businessSegment || null;
        }
        if (updateUserDto.business.businessDescription !== undefined) {
          user.business.businessDescription = updateUserDto.business.businessDescription || null;
        }
        if (updateUserDto.business.gstNumber !== undefined) {
          user.business.gstNumber = updateUserDto.business.gstNumber || null;
        }
        if (updateUserDto.business.websiteUrl !== undefined) {
          user.business.websiteUrl = updateUserDto.business.websiteUrl || null;
        }
        if (updateUserDto.business.businessLogo !== undefined) {
          user.business.businessLogo = updateUserDto.business.businessLogo || null;
        }

        // Save will UPDATE because entity has ID
        await this.businessRepository.save(user.business);
      } else if (hasBusinessFields) {
        // CREATE new business only if none exists and has fields
        const newBusiness = this.businessRepository.create({
          userId: user.id,
          businessName: updateUserDto.business.businessName || null,
          businessType: updateUserDto.business.businessType || null,
          businessSegment: updateUserDto.business.businessSegment || null,
          businessDescription: updateUserDto.business.businessDescription || null,
          gstNumber: updateUserDto.business.gstNumber || null,
          websiteUrl: updateUserDto.business.websiteUrl || null,
          businessLogo: updateUserDto.business.businessLogo || null,
        });

        // Save will INSERT because entity has no ID
        await this.businessRepository.save(newBusiness);
      }
      // If no business exists and no fields provided, skip (don't create empty record)
    }

    // Save user
    const updatedUser = await this.userRepository.save(user);

    // Reload user with relations to get updated address and business
    const userWithRelations = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['addresses', 'business'],
    });

    if (!userWithRelations) {
      throw new NotFoundException('User not found after update');
    }

    // Get the default address (single object, same as business)
    const defaultAddress = userWithRelations.addresses?.find(
      (addr) => addr.addressType === 'default',
    );

    // Transform address to AddressDto format (single object)
    const addressDto = defaultAddress
      ? {
          addressType: defaultAddress.addressType,
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipcode: defaultAddress.zipcode,
          country: defaultAddress.country,
        }
      : undefined;

    // Transform business to BusinessDto format
    const businessDto = userWithRelations.business
      ? {
          businessName: userWithRelations.business.businessName,
          businessType: userWithRelations.business.businessType,
          businessSegment: userWithRelations.business.businessSegment,
          businessDescription: userWithRelations.business.businessDescription,
          gstNumber: userWithRelations.business.gstNumber,
          websiteUrl: userWithRelations.business.websiteUrl,
          businessLogo: userWithRelations.business.businessLogo,
        }
      : undefined;

    return new ProfileDto({
      id: userWithRelations.id,
      email: userWithRelations.email,
      firstName: userWithRelations.firstName,
      lastName: userWithRelations.lastName,
      phone: userWithRelations.phone,
      emailVerified: userWithRelations.emailVerified,
      phoneVerified: userWithRelations.phoneVerified,
      role: userWithRelations.role,
      status: userWithRelations.status,
      profileImage: userWithRelations.profileImage,
      address: addressDto,
      business: businessDto,
      createdAt: userWithRelations.createdAt,
      updatedAt: userWithRelations.updatedAt,
    });
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, BCRYPT_SALT_ROUNDS);

    // Update password
    await this.userRepository.update(userId, {
      passwordHash: hashedNewPassword,
    });
  }
}
