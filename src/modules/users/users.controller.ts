// This controller is deprecated. Endpoints have been moved to:
// - User profile: /webapp/profile (WebApp - User Profile)
// - Admin user management: /admin/users (Admin - User Management)
// - Admin users management: /admin/admin-users (Admin - Admin Users Management)

import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users (Deprecated)')
@Controller('users')
export class UsersController {
  // All endpoints have been moved to appropriate modules
  // This controller is kept for backward compatibility but should not be used
}
