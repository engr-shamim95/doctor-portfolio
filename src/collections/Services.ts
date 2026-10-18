// src/collections/Services.ts
import type { CollectionConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';
import { createAuditLogAfterChange, createAuditLogAfterDelete } from '../hooks/auditLogHook';

export const Services: CollectionConfig = {
  slug: 'services',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'isPublished', 'order'],
    group: 'Clinical Practice',
  },
  access: {
    read: () => true,
    create: isSuperAdminOrDoctor,
    update: isSuperAdminOrDoctor,
    delete: isSuperAdminOrDoctor,
  },
  hooks: {
    afterChange: [createAuditLogAfterChange],
    afterDelete: [createAuditLogAfterDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'isPublished',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};

export default Services;
