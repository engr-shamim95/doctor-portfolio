import React from 'react';
import { BookingWizard } from '@/components/booking/BookingWizard';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AppointmentPage({ params }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {isBn ? 'অনলাইন অ্যাপয়েন্টমেন্ট বুকিং' : 'Online Appointment Booking'}
        </h1>
        <p className="text-muted-foreground text-base">
          {isBn
            ? 'খুব সহজে আপনার সুবিধাজনক চেম্বার ও সময় বেছে নিয়ে সিরিয়াল বুক করুন।'
            : 'Select your preferred chamber and reserve your clinical consultation slot.'}
        </p>
      </div>

      <BookingWizard locale={locale} />
    </div>
  );
}
