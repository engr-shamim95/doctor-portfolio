// src/collections/Chambers.ts
import type { CollectionConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';
import { createAuditLogAfterChange, createAuditLogAfterDelete } from '../hooks/auditLogHook';

export const Chambers: CollectionConfig = {
  slug: 'chambers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'bookingMode', 'isActive'],
    group: 'Appointments & Patients',
  },
  access: {
    read: () => true, // Publicly readable for appointment booking
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
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'address',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      defaultValue: 'Dhaka',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
    },
    {
      name: 'bookingMode',
      type: 'select',
      required: true,
      defaultValue: 'SLOT',
      options: [
        { label: 'Time Slot (SLOT)', value: 'SLOT' },
        { label: 'Serial Queue (SERIAL)', value: 'SERIAL' },
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
      name: 'slotDurationMinutes',
      type: 'number',
      required: true,
      defaultValue: 15,
    },
    {
      name: 'maxPatients',
      type: 'number',
      required: true,
      defaultValue: 16,
    },
    {
      name: 'mapUrl',
      type: 'text',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};

export default Chambers;
