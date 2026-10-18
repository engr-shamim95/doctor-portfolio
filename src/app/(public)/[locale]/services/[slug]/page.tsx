import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bn } from '@messages/bn';
import { en } from '@messages/en';

type Props = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export default async function ServiceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  const service = dict.services.items.find((s) => s.slug === slug);
  if (!service) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href={`/${locale}/services`} className="text-sm text-primary hover:underline font-medium">
          ← {isBn ? 'সব সেবাসমূহ' : 'All Services'}
        </Link>
      </div>

      <div className="space-y-4 border-b pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {isBn ? service.titleBn || service.title : service.title}
        </h1>
        <div className="text-sm font-semibold text-primary">
          BMDC: A-54321 | {dict.doctor.name}
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed space-y-4">
        <p className="text-lg font-medium text-foreground">{service.description}</p>
        <p>
          {isBn
            ? 'আমাদের চেম্বারে রোগীদের অত্যন্ত গুরুত্ব সহকারে পরীক্ষা করা হয় এবং রোগের মূল কারণ শনাক্ত করে যথাযথ গাইডলাইন প্রদান করা হয়।'
            : 'At our clinical consultation chambers, comprehensive patient examinations and evidence-based diagnostic protocols are implemented for optimal clinical outcomes.'}
        </p>
      </div>

      <div className="rounded-2xl border bg-muted/40 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
        <div>
          <h3 className="font-bold text-foreground">
            {isBn ? 'এই সেবার জন্য পরামর্শ নিতে চান?' : 'Need consultation for this condition?'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isBn ? 'অনলাইনে দ্রুত আপনার সুবিধাজনক স্লট নির্বাচন করুন।' : 'Select an available slot easily online.'}
          </p>
        </div>
        <Link
          href={`/${locale}/appointment?service=${service.id}`}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
        >
          {dict.common.appointment}
        </Link>
      </div>
    </div>
  );
}
