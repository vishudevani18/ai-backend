import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { BCRYPT_SALT_ROUNDS } from '../../common/constants/auth.constants';

export async function createSuperAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  // Only create if credentials are provided
  if (!superAdminEmail || !superAdminPassword) {
    console.log('⚠️  Super admin credentials not provided. Skipping super admin creation.');
    return;
  }

  // Check if super admin already exists
  const existingSuperAdmin = await userRepository.findOne({
    where: { email: superAdminEmail },
  });

  if (existingSuperAdmin) {
    console.log(`✅ Super admin already exists: ${superAdminEmail}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(superAdminPassword, BCRYPT_SALT_ROUNDS);

  // Create super admin
  const superAdmin = userRepository.create({
    email: superAdminEmail,
    passwordHash,
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+919999999999', // Default phone, should be updated after first login
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: true,
    phoneVerified: true,
  });

  await userRepository.save(superAdmin);
  console.log(`✅ Super admin created successfully: ${superAdminEmail}`);
}
