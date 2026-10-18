// src/collections/Users.ts
import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload';
import { canReadUsers, isSelfOrSuperAdmin, isSuperAdmin, isSuperAdminField } from '../lib/auth';
import { createAuditLogAfterChange, createAuditLogAfterDelete } from '../hooks/auditLogHook';

/**
 * Prevents deactivating or demoting the last remaining active Super Admin.
 * Guarantees the system administrative plane cannot be locked out via UI or API.
 */
export const preventLastSuperAdminDemotionOrDeactivation: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  // 1. Only existing document updates can demote or deactivate
  if (operation !== 'update' || !originalDoc) {
    return data;
  }

  // 2. Detect if the user being updated is currently an active Super Admin
  const isCurrentActiveSuperAdmin =
    originalDoc.role === 'super-admin' && Boolean(originalDoc.isActive);

  if (!isCurrentActiveSuperAdmin) {
    return data;
  }

  // 3. Detect if this update deactivates or demotes the user
  const isDeactivating = data.isActive === false;
  const isDemoting = data.role !== undefined && data.role !== 'super-admin';

  // Fast path: Routine field updates (name, phone, etc.) or affirming super-admin status
  // do not affect active admin count, avoiding database query overhead.
  if (!isDeactivating && !isDemoting) {
    return data;
  }

  // 4. Query total active Super Admins currently in the system
  const superAdmins = await req.payload.find({
    collection: 'users',
    where: {
      and: [
        { role: { equals: 'super-admin' } },
        { isActive: { equals: true } },
      ],
    },
  });

  const targetUser = superAdmins.docs?.find(
    (doc) => String(doc.id) === String(originalDoc.id)
  );

  // 5. If this update would reduce active Super Admins to 0, reject with actionable error
  if ((targetUser || isCurrentActiveSuperAdmin) && (superAdmins.totalDocs ?? 0) <= 1) {
    const action =
      isDeactivating && isDemoting
        ? 'deactivate or demote'
        : isDeactivating
          ? 'deactivate'
          : 'demote';
    throw new Error(
      `Action rejected: Cannot ${action} the last remaining active Super Admin.`
    );
  }

  return data;
};

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 28800, // 8 hours
    maxLoginAttempts: 5,
    lockTime: 600000, // 10 minutes
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'phone', 'isActive'],
  },
  access: {
    admin: ({ req: { user } }) => Boolean(user && (user as { isActive?: boolean }).isActive),
    create: isSuperAdmin,
    read: canReadUsers,
    update: isSelfOrSuperAdmin,
    delete: isSuperAdmin,
  },
  hooks: {
    beforeChange: [preventLastSuperAdminDemotionOrDeactivation],
    beforeDelete: [
      async ({ req, id }) => {
        // Prevent deleting the last active super-admin
        const superAdmins = await req.payload.find({
          collection: 'users',
          where: {
            and: [
              { role: { equals: 'super-admin' } },
              { isActive: { equals: true } },
            ],
          },
        });

        const targetUser = superAdmins.docs.find((doc) => String(doc.id) === String(id));
        if (targetUser && superAdmins.totalDocs <= 1) {
          throw new Error('Action rejected: Cannot delete the last remaining active Super Admin.');
        }
      },
    ],
    afterChange: [createAuditLogAfterChange],
    afterDelete: [createAuditLogAfterDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Full Name',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'assistant',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Doctor', value: 'doctor' },
        { label: 'Assistant / Receptionist', value: 'assistant' },
      ],
      access: {
        update: isSuperAdminField,
      },
      label: 'System Role',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Mobile Phone',
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'Phone number must be a string';
        const regex = /^\+8801[3-9]\d{8}$/;
        if (!regex.test(value)) {
          return 'Phone number must be a valid Bangladesh mobile (+8801XXXXXXXXX)';
        }
        return true;
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Account Active',
      access: {
        update: isSuperAdminField,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Administrative Notes',
      access: {
        read: isSuperAdminField,
        update: isSuperAdminField,
      },
    },
  ],
};
