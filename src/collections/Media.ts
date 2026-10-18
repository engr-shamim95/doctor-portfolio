// src/collections/Media.ts
import type { CollectionConfig } from 'payload';
import path from 'path';
import { fileURLToPath } from 'url';
import { isAuthenticated, isSuperAdminOrDoctor } from '../lib/auth';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    group: 'Content & Website',
  },
  access: {
    read: () => true, // Publicly readable for frontend presentation
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isSuperAdminOrDoctor,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: 'Alt Text (for accessibility & SEO)',
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: 'Image Caption',
    },
  ],
};
