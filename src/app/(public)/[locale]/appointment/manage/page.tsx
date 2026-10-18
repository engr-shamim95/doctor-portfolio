import React from 'react';
import Link from 'next/link';

type Props = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    id?: string;
    sig?: string;
    expires?: string;
    action?: string;
  }>;
};

export default async function ManageAppointmentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';
  const query = await searchParams;

  const isCancelled = query.action === 'cancel';

  return (
    <div className="max-w-xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border bg-card p-8 shadow-lg text-center space-y-6">
        <div className="text-4xl">{isCancelled ? '❌' : '📋'}</div>

        <h1 className="text-2xl font-bold text-foreground">
          {isCancelled
            ? (isBn ? 'অ্যাপয়েন্টমেন্ট বাতিল করণ' : 'Cancel Appointment')
            : (isBn ? 'অ্যাপয়েন্টমেন্ট পরিচালনা' : 'Manage Your Appointment')}
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {isCancelled
            ? (isBn
                ? 'আপনার বুকিংটি সফলভাবে বাতিল করা হয়েছে। স্লটটি অন্য রোগীর জন্য উন্মুক্ত করা হয়েছে।'
                : 'Your appointment has been successfully cancelled. The slot has been released for other patients.')
            : (isBn
                ? 'আপনার ভেরিফায়েড সাইনড লিংকের মাধ্যমে বুকিং তথ্য প্রদর্শিত হচ্ছে।'
                : 'Verified via cryptographic signature. Your booking details are active.')}
        </p>

        {query.id && (
          <div className="rounded-xl border bg-muted/40 p-4 text-xs font-mono text-muted-foreground break-all">
            Appointment ID: {query.id}
          </div>
        )}

        <div className="pt-4 flex justify-center gap-4">
          <Link
            href={`/${locale}/appointment`}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all"
          >
            {isBn ? 'নতুন বুকিং করুন' : 'Book New Appointment'}
          </Link>
          <Link
            href={`/${locale}`}
            className="rounded-xl border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition-all"
          >
            {isBn ? 'হোমে ফিরে যান' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
