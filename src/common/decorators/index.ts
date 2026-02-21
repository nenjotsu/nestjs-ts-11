// src/common/decorators/index.ts
// ============================================================
// CUSTOM DECORATORS
// ============================================================

// ── @User() ─────────────────────────────────────────────────
// Parameter decorator: extracts the authenticated user (or a
// specific field) from the request object.
//
// Usage:
//   getProfile(@User() user: UserEntity)
//   getEmail(@User('email') email: string)
// ────────────────────────────────────────────────────────────
import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
  applyDecorators,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const User = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return field ? user?.[field] : user;
  },
);

// ── @Roles(...roles) ────────────────────────────────────────
// Metadata decorator: attaches required roles to a route.
// Consumed by RolesGuard.
// ────────────────────────────────────────────────────────────
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ── @Public() ───────────────────────────────────────────────
// Marks a route as publicly accessible (skips JWT guard).
// ────────────────────────────────────────────────────────────
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ── @ApiAuth() ──────────────────────────────────────────────
// Composite decorator: combines @UseGuards(AuthGuard) + @ApiBearerAuth()
// Reduces boilerplate on protected routes.
// ────────────────────────────────────────────────────────────
// import { AuthGuard } from '../guards/auth.guard';  // uncomment when guard exists
// export const ApiAuth = () =>
//   applyDecorators(UseGuards(AuthGuard), ApiBearerAuth());

// ── @CurrentUserId() ────────────────────────────────────────
// Convenience shortcut — extracts just the user ID.
// ────────────────────────────────────────────────────────────
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id;
  },
);