// src/collections/Schedules.ts
import type { CollectionConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';
import { createAuditLogAfterChange, createAuditLogAfterDelete } from '../hooks/auditLogHook';

export const Schedules: CollectionConfig = {
  slug: 'schedules',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['chamber', 'weekday', 'startTime', 'endTime', 'isActive'],
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
      required: true,
    },
    {
      name: 'weekday',
      type: 'select',
      required: true,
      options: [
        { label: 'Sunday (০)', value: '0' },
        { label: 'Monday (১)', value: '1' },
        { label: 'Tuesday (২)', value: '2' },
        { label: 'Wednesday (৩)', value: '3' },
        { label: 'Thursday (৪)', value: '4' },
        { label: 'Friday (৫)', value: '5' },
        { label: 'Saturday (৬)', value: '6' },
      ],
    },
    {
      name: 'startTime',
      type: 'text',
      required: true,
      defaultValue: '17:00',
    },
    {
      name: 'endTime',
      type: 'text',
      required: true,
      defaultValue: '21:00',
    },
    {
      name: 'maxPatients',
      type: 'number',
      required: true,
      defaultValue: 16,
    },
    {
      name: 'slotDurationMinutes',
      type: 'number',
      required: true,
      defaultValue: 15,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};

export default Schedules;
