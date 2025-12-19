import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current authenticated user from the request
 * The user object is set by the JWT strategy after token validation
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): any => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
