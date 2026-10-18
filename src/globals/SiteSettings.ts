// src/globals/SiteSettings.ts
import type { GlobalConfig } from 'payload';
import { isSuperAdminOrDoctor } from '../lib/auth';

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings & Emergency Hotline',
  access: {
    read: () => true,
    update: isSuperAdminOrDoctor,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      localized: true,
      label: 'Site Brand Name',
    },
    {
      name: 'tagline',
      type: 'text',
      required: true,
      localized: true,
      label: 'Clinical Tagline / Motto',
    },
    {
      name: 'clinicName',
      type: 'text',
      required: true,
      localized: true,
      label: 'Primary Practice / Consultation Centre Name',
    },
    {
      name: 'emergencyHotline',
      type: 'text',
      required: true,
      label: '24/7 Emergency Hotline Number',
    },
    {
      name: 'emergencyDisclaimer',
      type: 'textarea',
      required: true,
      localized: true,
      label: 'Emergency Care Legal & Medical Disclaimer',
      defaultValue:
        'জরুরি চিকিৎসা সেবার ক্ষেত্রে (যেমন: তীব্র বুকে ব্যথা, শ্বাসকষ্ট বা সংজ্ঞাহীনতা) অনুগ্রহ করে অনতিবিলম্বে নিকটস্থ হাসপাতালের জরুরি বিভাগে যোগাযোগ করুন। এই অনলাইন পোর্টাল শুধুমাত্র পূর্বনির্ধারিত সাধারণ ও বিশেষজ্ঞ পরামর্শের জন্য প্রযোজ্য।',
    },
    {
      name: 'emergencyNoticeBanner',
      type: 'group',
      label: 'Header Emergency Announcement Banner',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show Emergency Announcement Banner',
        },
        {
          name: 'message',
          type: 'text',
          localized: true,
          label: 'Banner Announcement Message',
        },
        {
          name: 'type',
          type: 'select',
          defaultValue: 'info',
          options: [
            { label: 'Informational (Blue)', value: 'info' },
            { label: 'Warning / Holiday (Amber)', value: 'warning' },
            { label: 'Critical Alert (Red)', value: 'critical' },
          ],
          label: 'Banner Severity Style',
        },
      ],
    },
    {
      name: 'maintenanceMode',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enable Maintenance Mode (Halts public site with notice)',
    },
    {
      name: 'bookingEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable Online Appointment Booking (Master Switch)',
    },
    {
      name: 'bookingNotice',
      type: 'textarea',
      localized: true,
      label: 'General Notice for Patients During Booking',
      defaultValue:
        'অনুগ্রহ করে নির্ধারিত সময়ের অন্তত ১৫ মিনিট পূর্বে চেম্বারে উপস্থিত থাকুন এবং আপনার পূর্ববর্তী সমস্ত প্রেসক্রিপশন ও রিপোর্ট সঙ্গে রাখুন।',
    },
    {
      name: 'contactEmail',
      type: 'email',
      required: true,
      label: 'Clinic Public Contact Email',
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      required: true,
      label: 'Direct WhatsApp Contact (+8801XXXXXXXXX)',
      validate: (value: unknown) => {
        if (typeof value !== 'string') return 'WhatsApp number must be a string';
        const regex = /^\+8801[3-9]\d{8}$/;
        if (!regex.test(value)) {
          return 'WhatsApp number must be a valid Bangladesh phone number (+8801XXXXXXXXX)';
        }
        return true;
      },
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Social Profiles',
      fields: [
        {
          name: 'facebook',
          type: 'text',
          label: 'Facebook Page URL',
        },
        {
          name: 'linkedin',
          type: 'text',
          label: 'LinkedIn Profile URL',
        },
        {
          name: 'youtube',
          type: 'text',
          label: 'YouTube Channel / Video URL',
        },
      ],
    },
  ],
};
