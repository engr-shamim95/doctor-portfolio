import React from 'react';
import Link from 'next/link';
import { bn } from '@messages/bn';
import { en } from '@messages/en';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ServicesPage({ params }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {dict.services.title}
        </h1>
        <p className="text-muted-foreground text-base">
          {dict.services.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {dict.services.items.map((svc) => (
          <div
            key={svc.id}
            className="service-card rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="text-4xl">🩺</div>
              <h2 className="text-2xl font-bold text-card-foreground">
                {svc.title}
              </h2>
              {isBn && svc.titleBn && (
                <div className="text-sm font-semibold text-primary">{svc.titleBn}</div>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {svc.description}
              </p>
            </div>
            <div className="pt-6 border-t mt-6 flex justify-between items-center">
              <Link
                href={`/${locale}/services/${svc.slug}`}
                className="text-sm font-bold text-primary hover:underline"
              >
                {dict.common.readMore} →
              </Link>
              <Link
                href={`/${locale}/appointment?service=${svc.id}`}
                className="rounded-lg bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                {dict.common.appointment}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
