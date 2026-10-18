// src/globals/DoctorProfile.ts
import type { GlobalConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';

export const DoctorProfile: GlobalConfig = {
  slug: 'doctor-profile',
  label: 'Doctor Profile & Credentials',
  access: {
    read: () => true,
    update: isSuperAdminOrDoctor,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      label: 'Doctor Full Name with Title',
    },
    {
      name: 'designation',
      type: 'text',
      required: true,
      localized: true,
      label: 'Academic & Clinical Designation',
    },
    {
      name: 'speciality',
      type: 'text',
      required: true,
      localized: true,
      label: 'Primary Medical Speciality',
    },
    {
      name: 'bmdcRegistrationNumber',
      type: 'text',
      required: true,
      label: 'BMDC Registration Number',
      validate: (value: unknown) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return 'BMDC Registration Number is required by medical regulations';
        }
        return true;
      },
    },
    {
      name: 'profileImage',
      type: 'relationship',
      relationTo: 'media',
      required: true,
      label: 'Official Portrait / Profile Photo',
    },
    {
      name: 'signatureImage',
      type: 'relationship',
      relationTo: 'media',
      label: 'Digital Prescription Signature Asset (Optional)',
    },
    {
      name: 'biography',
      type: 'richText',
      required: true,
      localized: true,
      label: 'Comprehensive Professional Biography',
    },
    {
      name: 'degrees',
      type: 'array',
      label: 'Academic Degrees & Certifications',
      fields: [
        {
          name: 'degree',
          type: 'text',
          required: true,
          label: 'Degree (e.g. MBBS, FCPS, MD, MRCP)',
        },
        {
          name: 'institution',
          type: 'text',
          required: true,
          label: 'Awarding Institution / University',
        },
        {
          name: 'year',
          type: 'text',
          label: 'Graduation Year',
        },
      ],
    },
    {
      name: 'experienceTimeline',
      type: 'array',
      label: 'Career & Clinical Experience Timeline',
      fields: [
        {
          name: 'role',
          type: 'text',
          required: true,
          localized: true,
          label: 'Position / Clinical Role',
        },
        {
          name: 'organization',
          type: 'text',
          required: true,
          localized: true,
          label: 'Hospital / Institute Name',
        },
        {
          name: 'startYear',
          type: 'text',
          required: true,
          label: 'Start Year',
        },
        {
          name: 'endYear',
          type: 'text',
          label: 'End Year (Leave empty if current)',
        },
        {
          name: 'isCurrent',
          type: 'checkbox',
          defaultValue: false,
          label: 'Currently Serving Here',
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
          label: 'Brief Description of Responsibilities',
        },
      ],
    },
    {
      name: 'awards',
      type: 'array',
      label: 'Honors & Awards',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
          label: 'Award Title',
        },
        {
          name: 'organization',
          type: 'text',
          label: 'Awarding Organization',
        },
        {
          name: 'year',
          type: 'text',
          label: 'Year',
        },
      ],
    },
    {
      name: 'memberships',
      type: 'array',
      label: 'Professional Memberships & Fellowships',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Society / College Name (e.g. BSC, ACC, ESC)',
        },
        {
          name: 'role',
          type: 'text',
          label: 'Membership Grade / Status (e.g. Fellow, Life Member)',
        },
      ],
    },
    {
      name: 'contactDetails',
      type: 'group',
      label: 'Professional Contact Details',
      fields: [
        {
          name: 'officePhone',
          type: 'text',
          label: 'Office Consultation Phone',
        },
        {
          name: 'officialEmail',
          type: 'email',
          label: 'Official Inquiry Email',
        },
        {
          name: 'assistantPhone',
          type: 'text',
          label: 'Senior Assistant / Secretariat Phone',
        },
      ],
    },
  ],
};
