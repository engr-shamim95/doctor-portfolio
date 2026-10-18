// src/collections/Appointments.ts
import type { CollectionConfig } from 'payload';
import { hasRole } from '../lib/auth';
import { createAuditLogAfterChange, createAuditLogAfterDelete } from '../hooks/auditLogHook';

export const Appointments: CollectionConfig = {
  slug: 'appointments',
  admin: {
    useAsTitle: 'referenceCode',
    defaultColumns: ['referenceCode', 'patientName', 'date', 'slotStart', 'serialNumber', 'status'],
    group: 'Appointments & Patients',
  },
  access: {
    read: hasRole('super-admin', 'doctor', 'assistant'),
    create: () => true, // Allowed for public booking API & staff
    update: hasRole('super-admin', 'doctor', 'assistant'),
    delete: hasRole('super-admin'),
  },
  hooks: {
    afterChange: [createAuditLogAfterChange],
    afterDelete: [createAuditLogAfterDelete],
  },
  fields: [
    {
      name: 'referenceCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'chamber',
      type: 'relationship',
      relationTo: 'chambers' as any,
      required: true,
    },
    {
      name: 'date',
      type: 'text', // YYYY-MM-DD
      required: true,
      index: true,
    },
    {
      name: 'slotStart',
      type: 'text', // ISO or HH:MM
    },
    {
      name: 'slotEnd',
      type: 'text',
    },
    {
      name: 'serialNumber',
      type: 'number',
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
      name: 'patientName',
      type: 'text',
      required: true,
    },
    {
      name: 'patientPhone',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'patientEmail',
      type: 'email',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'PENDING',
      options: [
        { label: 'Pending (Hold)', value: 'PENDING' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'No Show', value: 'NO_SHOW' },
      ],
      index: true,
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'WEB',
      options: [
        { label: 'Web Portal', value: 'WEB' },
        { label: 'Admin Walk-in', value: 'ADMIN' },
        { label: 'Telephone', value: 'PHONE' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'expiresAt',
      type: 'date',
    },
  ],
};

export default Appointments;
