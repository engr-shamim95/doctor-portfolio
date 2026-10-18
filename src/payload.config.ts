// src/payload.config.ts
import { buildConfig } from 'payload';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { fileURLToPath } from 'url';

import { Users } from './collections/Users';
import { Media } from './collections/Media';
import { AuditLogs } from './collections/AuditLogs';
import { Chambers } from './collections/Chambers';
import { Schedules } from './collections/Schedules';
import { Leaves } from './collections/Leaves';
import { Appointments } from './collections/Appointments';
import { Services } from './collections/Services';
import { BlogPosts } from './collections/BlogPosts';
import { Testimonials } from './collections/Testimonials';
import { FAQs } from './collections/FAQs';

import { DoctorProfile } from './globals/DoctorProfile';
import { SiteSettings } from './globals/SiteSettings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' | Dr. Specialized Clinical Care',
    },
  },
  collections: [
    Users,
    Media,
    AuditLogs,
    Chambers,
    Schedules,
    Leaves,
    Appointments,
    Services,
    BlogPosts,
    Testimonials,
    FAQs,
  ],
  globals: [
    DoctorProfile,
    SiteSettings,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'TEMPORARY_FALLBACK_SECRET_MIN_32_CHARS_LONG_12345',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgresql://postgres:postgres@127.0.0.1:5432/doctor_portfolio',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl:
        process.env.DATABASE_URI?.includes('supabase') ||
        process.env.DATABASE_URI?.includes('neon') ||
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : undefined,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false,
  }),
  localization: {
    locales: [
      {
        label: 'বাংলা (Bangla)',
        code: 'bn',
      },
      {
        label: 'English',
        code: 'en',
      },
    ],
    defaultLocale: 'bn',
    fallback: true,
  },
});
