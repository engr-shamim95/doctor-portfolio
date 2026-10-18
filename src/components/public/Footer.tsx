import React from 'react';
import Link from 'next/link';

type Props = {
  locale: string;
};

export function Footer({ locale }: Props) {
  const isBn = locale === 'bn';

  return (
    <footer className="border-t bg-muted/30 py-12 px-4 sm:px-6 lg:px-8 mt-auto pb-24 sm:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🩺</span>
            <span className="font-bold text-lg">{isBn ? 'ডাঃ আরিফুল ইসলাম' : 'Dr. Ariful Islam'}</span>
          </div>
          <div className="text-sm font-semibold text-primary">
            BMDC: A-54321 | {isBn ? 'এমবিবিএস, এফসিপিএস (মেডিসিন)' : 'MBBS, FCPS (Medicine)'}
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {isBn
              ? 'সুস্থ ও দীর্ঘায়িত জীবনের জন্য সার্বিক পরামর্শ ও আধুনিক চিকিৎসা সেবা।'
              : 'Dedicated to compassionate, high-standard patient care and clinical medicine excellence.'}
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{isBn ? 'দ্রুত লিংক' : 'Quick Links'}</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>
              <Link href={`/${locale}/services`} className="hover:text-foreground transition-colors">
                {isBn ? 'সেবাসমূহ' : 'Services'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/chambers`} className="hover:text-foreground transition-colors">
                {isBn ? 'চেম্বার ও সময়সূচী' : 'Chambers'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/blog`} className="hover:text-foreground transition-colors">
                {isBn ? 'স্বাস্থ্য ব্লগ' : 'Health Blog'}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/appointment`} className="hover:text-foreground transition-colors">
                {isBn ? 'অ্যাপয়েন্টমেন্ট' : 'Appointment'}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{isBn ? 'চেম্বারের হটলাইন' : 'Serial Hotline'}</h4>
          <p className="text-sm text-muted-foreground">
            {isBn ? 'ধানমন্ডি:' : 'Dhanmondi:'} +8801700112233
            <br />
            {isBn ? 'উত্তরা:' : 'Uttara:'} +8801700223344
          </p>
          <div className="pt-2">
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground underline">
              {isBn ? 'অ্যাডমিন পোর্টাল' : 'Staff Login'}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <div>
          © {new Date().getFullYear()} {isBn ? 'ডাঃ আরিফুল ইসলাম' : 'Dr. Ariful Islam'}. All rights reserved.
        </div>
        <div>
          {isBn ? 'কারিগরি সহযোগিতায় আধুনিক নেক্সট.জেএস ও পেলোড সিএমএস' : 'Powered by Next.js & Payload CMS'}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
