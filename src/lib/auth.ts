// src/lib/auth.ts
import type { Access, FieldAccess, Where } from 'payload';

export type UserRole = 'super-admin' | 'doctor' | 'assistant';

interface AuthUser {
  id?: string | number;
  role?: string;
  isActive?: boolean;
}

/**
 * Checks if the request is from an authenticated, active user.
 */
export const isAuthenticated: Access = ({ req: { user } }) => {
  const u = user as AuthUser | null;
  return Boolean(u && u.isActive);
};

/**
 * Checks if the user has any of the specified roles.
 */
export const hasRole = (...roles: UserRole[]): Access => {
  return ({ req: { user } }) => {
    const u = user as AuthUser | null;
    if (!u || !u.isActive) return false;
    return roles.includes(u.role as UserRole);
  };
};

/**
 * Super Admin only access.
 */
export const isSuperAdmin: Access = hasRole('super-admin');

/**
 * Super Admin or Doctor access.
 */
export const isSuperAdminOrDoctor: Access = hasRole('super-admin', 'doctor');

/**
 * User can access if they are super-admin, or if the target document belongs to them.
 */
export const isSelfOrSuperAdmin: Access = ({ req: { user } }) => {
  const u = user as AuthUser | null;
  if (!u || !u.isActive) return false;
  if (u.role === 'super-admin') return true;

  return {
    id: {
      equals: u.id,
    },
  };
};

/**
 * Users collection read access:
 * - super-admin: full visibility
 * - doctor: can read self and all assistants
 * - assistant: can read only self
 */
export const canReadUsers: Access = ({ req: { user } }) => {
  const u = user as AuthUser | null;
  if (!u || !u.isActive) return false;
  if (u.role === 'super-admin') return true;
  if (u.role === 'doctor') {
    const where: Where = {
      or: [
        { id: { equals: u.id } },
        { role: { equals: 'assistant' } },
      ],
    };
    return where;
  }
  if (u.role === 'assistant') {
    return {
      id: { equals: u.id },
    };
  }
  return false;
};

/**
 * Field-level access: Only super-admin can modify this field.
 */
export const isSuperAdminField: FieldAccess = ({ req: { user } }) => {
  const u = user as AuthUser | null;
  return Boolean(u && u.isActive && u.role === 'super-admin');
};
