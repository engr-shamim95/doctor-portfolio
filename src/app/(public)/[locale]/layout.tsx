import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { inter, hindSiliguri } from '@/app/fonts';
import '@/app/globals.css';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { EmergencyBanner } from '@/components/public/EmergencyBanner';
import { StickyMobileActionBar } from '@/components/public/StickyMobileActionBar';

export const metadata: Metadata = {
  title: {
    template: '%s | ডাঃ আরিফুল ইসলাম | Dr. Ariful Islam',
    default: 'ডাঃ আরিফুল ইসলাম (Dr. Ariful Islam) - MBBS, FCPS (Medicine) - Specialist Portfolio & Appointments',
  },
  description: 'Specialist in Internal Medicine & Cardiology. Online appointment booking, chamber visiting hours, and health advice.',
};

type Props = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function PublicLocalizedLayout({ children, params }: Props) {
  const { locale } = await params;

  if (locale !== 'bn' && locale !== 'en') {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${hindSiliguri.variable} font-sans min-h-screen bg-background text-foreground antialiased flex flex-col`}
      >
        <EmergencyBanner locale={locale} />
        <Navbar locale={locale} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} />
        <StickyMobileActionBar locale={locale} />
      </body>
    </html>
  );
}
