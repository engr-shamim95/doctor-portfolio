// src/collections/Leaves.ts
import type { CollectionConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';
import { createAuditLogAfterChange, createAuditLogAfterDelete } from '../hooks/auditLogHook';

export const Leaves: CollectionConfig = {
  slug: 'leaves',
  admin: {
    useAsTitle: 'reason',
    defaultColumns: ['chamber', 'startDate', 'endDate', 'isAllDay', 'reason'],
    group: 'Appointments & Patients',
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
      name: 'chamber',
      type: 'relationship',
      relationTo: 'chambers' as any,
      // If null, applies to all chambers
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
      required: true,
    },
    {
      name: 'isAllDay',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'reason',
      type: 'text',
      required: true,
      defaultValue: 'Medical Conference / Leave',
    },
  ],
};

export default Leaves;
