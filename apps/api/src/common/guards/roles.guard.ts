import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // No roles defined, meaning it's accessible to any authenticated user
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException('User roles not found');
    }
    
    if (user.roles.includes('SUPER_ADMIN')) {
      return true; // Super admins bypass all role checks
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return true;
  }
}

