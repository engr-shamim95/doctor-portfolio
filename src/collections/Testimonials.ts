// src/collections/Testimonials.ts
import type { CollectionConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';
import { createAuditLogAfterChange, createAuditLogAfterDelete } from '../hooks/auditLogHook';

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'patientName',
    defaultColumns: ['patientName', 'rating', 'status'],
  },
  access: {
    read: () => true,
    create: () => true, // Patients can submit feedback
    update: isSuperAdminOrDoctor, // Doctor moderates
    delete: isSuperAdminOrDoctor,
  },
  hooks: {
    afterChange: [createAuditLogAfterChange],
    afterDelete: [createAuditLogAfterDelete],
  },
  fields: [
    {
      name: 'patientName',
      type: 'text',
      required: true,
    },
    {
      name: 'feedback',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'PENDING',
      options: [
        { label: 'Pending Moderation', value: 'PENDING' },
        { label: 'Approved (Visible)', value: 'APPROVED' },
        { label: 'Hidden', value: 'HIDDEN' },
      ],
    },
  ],
};

export default Testimonials;
