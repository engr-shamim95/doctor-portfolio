// src/collections/AuditLogs.ts
import type { CollectionConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'collectionName', 'documentId', 'user', 'userRole', 'timestamp'],
    description: 'Immutable forensic audit trail tracking system mutations and administrative actions.',
    group: 'Administration',
  },
  access: {
    read: isSuperAdminOrDoctor,
    create: () => false, // Disallow manual creation via REST/Admin; created via hooks only
    update: () => false, // STRICTLY IMMUTABLE: Updates are forbidden
    delete: () => false, // STRICTLY IMMUTABLE: Deletions are forbidden
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Create Record', value: 'CREATE' },
        { label: 'Update Record', value: 'UPDATE' },
        { label: 'Delete Record', value: 'DELETE' },
        { label: 'Status Transition', value: 'STATUS_CHANGE' },
        { label: 'User Login', value: 'LOGIN' },
        { label: 'Failed Login', value: 'LOGIN_FAILED' },
      ],
      label: 'Operation Action',
    },
    {
      name: 'collectionName',
      type: 'text',
      required: true,
      label: 'Target Collection',
      index: true,
    },
    {
      name: 'documentId',
      type: 'text',
      required: true,
      label: 'Target Document ID',
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Executing User',
      index: true,
    },
    {
      name: 'userRole',
      type: 'text',
      label: 'User Role at Event Time',
    },
    {
      name: 'ipAddress',
      type: 'text',
      label: 'Client IP Address',
    },
    {
      name: 'userAgent',
      type: 'text',
      label: 'Client User Agent',
    },
    {
      name: 'diff',
      type: 'json',
      label: 'Field Modification Diff / Snapshot',
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: 'Event Timestamp (UTC)',
      index: true,
    },
  ],
};
