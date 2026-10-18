import React from 'react';
import Link from 'next/link';
import { bn } from '@messages/bn';
import { en } from '@messages/en';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  return (
    <div className="flex flex-col gap-16 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-8 sm:p-12 lg:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="credentials-badge">BMDC: {dict.doctor.bmdcNumber}</span>
              <span className="text-muted-foreground">|</span>
              <span>{isBn ? 'ভেরিফায়েড বিশেষজ্ঞ' : 'Verified Specialist'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              {dict.doctor.name}
            </h1>

            <p className="text-lg sm:text-xl font-medium text-primary">
              {dict.doctor.degrees}
            </p>

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
              {dict.doctor.bio}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href={`/${locale}/appointment`}
                className="hero-cta inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-[1.02] transition-all"
              >
                📅 {isBn ? 'অ্যাপয়েন্টমেন্ট নিন (Book Appointment)' : 'Book Appointment'}
              </Link>
              <Link
                href={`/${locale}/chambers`}
                className="inline-flex items-center justify-center rounded-xl border border-input bg-background/80 backdrop-blur px-6 py-3.5 text-base font-semibold text-foreground hover:bg-accent transition-all"
              >
                🏥 {isBn ? 'চেম্বার শিডিউল' : 'Chamber Schedule'}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-border/60">
              <div className="space-y-1">
                <div
                  className="stats text-2xl sm:text-3xl font-extrabold text-foreground"
                  data-experience={dict.doctor.experienceCount}
                >
                  {dict.doctor.experienceYears}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {isBn ? 'অভিজ্ঞ চিকিৎসা সেবা' : 'Clinical Experience'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {dict.doctor.totalPatients.split(' ')[0]}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {isBn ? 'সন্তুষ্ট রোগী' : 'Treated Patients'}
                </div>
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">২টি</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {isBn ? 'আধুনিক চেম্বার' : 'Hospital Chambers'}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-tr from-primary/30 to-accent/30 border-2 border-primary/20 flex flex-col items-center justify-center text-center p-6 shadow-2xl backdrop-blur">
              <div className="text-7xl mb-4">👨‍⚕️</div>
              <div className="font-bold text-xl text-foreground">{dict.doctor.name}</div>
              <div className="text-xs text-primary font-medium mt-1">{dict.doctor.degrees}</div>
              <div className="mt-4 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold border border-emerald-500/20">
                🟢 {isBn ? 'নতুন রোগী দেখা হচ্ছে' : 'Accepting Appointments'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {dict.services.title}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {dict.services.subtitle}
            </p>
          </div>
          <Link
            href={`/${locale}/services`}
            className="text-primary text-sm font-semibold hover:underline"
          >
            {dict.common.viewAll} →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dict.services.items.map((svc) => (
            <div
              key={svc.id}
              className="service-card rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="text-3xl">🩺</div>
                <h3 className="text-xl font-bold text-card-foreground">
                  {isBn ? svc.titleBn : svc.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {svc.description}
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href={`/${locale}/services/${svc.slug}`}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {dict.common.readMore} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chambers & Visiting Hours Preview */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {dict.chambers.title}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {dict.chambers.subtitle}
            </p>
          </div>
          <Link
            href={`/${locale}/chambers`}
            className="text-primary text-sm font-semibold hover:underline"
          >
            {dict.common.viewAll} →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dict.chambers.items.map((ch) => (
            <div
              key={ch.id}
              className="chamber-card rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-card-foreground">{ch.name}</h3>
                  <div className="text-sm text-primary font-medium">{ch.fullName}</div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary/10 text-primary">
                  {ch.mode === 'SLOT' ? (isBn ? 'স্লট মোড' : 'Slot Booking') : (isBn ? 'সিরিয়াল মোড' : 'Serial Booking')}
                </span>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <div>📍 {ch.address}</div>
                <div className="font-medium text-foreground">⏰ {ch.schedule}</div>
                <div>📞 {ch.phone}</div>
              </div>

              <div className="flex gap-3 pt-2">
                <Link
                  href={`/${locale}/appointment?chamber=${ch.id}`}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-center text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isBn ? 'বুকিং দিন' : 'Book Here'}
                </Link>
                <a
                  href={ch.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border px-3 py-2.5 text-center text-xs sm:text-sm font-semibold hover:bg-accent transition-colors"
                >
                  🗺️ {isBn ? 'ম্যাপ' : 'Map'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Health Blog Preview */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {dict.blog.title}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-1">
              {dict.blog.subtitle}
            </p>
          </div>
          <Link
            href={`/${locale}/blog`}
            className="text-primary text-sm font-semibold hover:underline"
          >
            {dict.common.viewAll} →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dict.blog.articles.map((art) => (
            <article
              key={art.id}
              className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>📅 {art.date}</span>
                  <span className="reading-time font-semibold text-primary">{art.readingTime}</span>
                </div>
                <h3 className="text-xl font-bold text-card-foreground">
                  {isBn ? art.titleBn : art.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {art.excerpt}
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href={`/${locale}/blog/${art.slug}`}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {dict.common.readMore} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
