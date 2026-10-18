import React from 'react';
import Link from 'next/link';
import { bn } from '@messages/bn';
import { en } from '@messages/en';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  const qualifications = [
    { degree: 'MBBS', institution: 'Dhaka Medical College', year: '2012' },
    { degree: 'FCPS (Medicine)', institution: 'Bangladesh College of Physicians and Surgeons (BCPS)', year: '2018' },
    { degree: 'Fellowship in Preventive Cardiology', institution: 'National Institute of Cardiovascular Diseases (NICVD)', year: '2021' },
  ];

  const experience = [
    { role: 'Associate Consultant (Medicine)', org: 'Square Hospitals Ltd.', period: '2021 - Present' },
    { role: 'Resident Physician', org: 'Dhaka Medical College Hospital', period: '2015 - 2020' },
    { role: 'Medical Officer', org: 'Chittagong Medical College Hospital', period: '2013 - 2015' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
          <span className="credentials-badge">BMDC: {dict.doctor.bmdcNumber}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground">
          {dict.doctor.name}
        </h1>
        <p className="text-lg font-semibold text-primary">
          {dict.doctor.degrees}
        </p>
        <p className="text-muted-foreground leading-relaxed">
          {dict.doctor.bio}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            {isBn ? 'শিক্ষাগত যোগ্যতা ও ডিগ্রি' : 'Qualifications & Degrees'}
          </h2>
          <div className="space-y-4">
            {qualifications.map((q, i) => (
              <div key={i} className="border-l-2 border-primary pl-4 space-y-1">
                <div className="font-bold text-foreground">{q.degree}</div>
                <div className="text-sm text-muted-foreground">{q.institution}</div>
                <div className="text-xs font-mono text-primary font-semibold">{q.year}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            {isBn ? 'কর্মঅভিজ্ঞতার টাইমলাইন' : 'Clinical Experience Timeline'}
          </h2>
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i} className="border-l-2 border-muted-foreground/30 pl-4 space-y-1">
                <div className="font-bold text-foreground">{exp.role}</div>
                <div className="text-sm text-muted-foreground">{exp.org}</div>
                <div className="text-xs font-mono text-muted-foreground">{exp.period}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center space-y-6 shadow-xl">
        <h3 className="text-2xl sm:text-3xl font-black">
          {isBn ? 'পরামর্শের জন্য অ্যাপয়েন্টমেন্ট বুক করুন' : 'Book a Clinical Consultation'}
        </h3>
        <p className="text-sm sm:text-base text-primary-foreground/90 max-w-xl mx-auto">
          {isBn
            ? 'সহজেই অনলাইন স্লট নির্বাচন করে চেম্বার ভিজিট কনফার্ম করুন।'
            : 'Select an available appointment time at Dhanmondi or Uttara chamber.'}
        </p>
        <Link
          href={`/${locale}/appointment`}
          className="inline-block rounded-xl bg-background text-foreground font-bold px-8 py-3.5 shadow hover:bg-background/90 transition-all text-sm"
        >
          {dict.common.appointment}
        </Link>
      </div>
    </div>
  );
}
