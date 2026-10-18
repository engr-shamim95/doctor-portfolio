import React from 'react';
import Link from 'next/link';
import { bn } from '@messages/bn';
import { en } from '@messages/en';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ChambersPage({ params }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {dict.chambers.title}
        </h1>
        <p className="text-muted-foreground text-base">
          {dict.chambers.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {dict.chambers.items.map((ch: { id: string; name: string; fullName: string; address: string; schedule: string; phone: string; mode: string; mapUrl: string }) => (
          <div
            key={ch.id}
            className="chamber-card rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow space-y-6 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">{ch.name}</h2>
                  <div className="text-sm font-semibold text-primary mt-0.5">{ch.fullName}</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {ch.mode === 'SLOT' ? (isBn ? 'স্লট মোড' : 'Slot Booking') : (isBn ? 'সিরিয়াল মোড' : 'Serial Booking')}
                </span>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground pt-2">
                <div className="flex items-start gap-2">
                  <span>📍</span>
                  <span>{ch.address}</span>
                </div>
                <div className="flex items-start gap-2 text-foreground font-medium">
                  <span>⏰</span>
                  <span>{ch.schedule}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span>📞</span>
                  <a href={`tel:${ch.phone}`} className="hover:underline font-mono">
                    {ch.phone}
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex flex-col sm:flex-row gap-3">
              <Link
                href={`/${locale}/appointment?chamber=${ch.id}`}
                className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow transition-all"
              >
                {isBn ? 'এই চেম্বারে বুকিং দিন' : 'Book at this Chamber'}
              </Link>
              <a
                href={ch.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border px-4 py-3 text-center text-sm font-semibold hover:bg-accent transition-colors"
              >
                🗺️ {isBn ? 'গুগল ম্যাপ' : 'Google Map'}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
