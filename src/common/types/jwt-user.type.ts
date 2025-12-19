/**
 * Type representing the user object set by JWT strategy
 * This is a plain object, not a User entity, so it should not be validated
 */
export interface JwtUser {
  id: string;
  email: string;
  role: string;
  status?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}
