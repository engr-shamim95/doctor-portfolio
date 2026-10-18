import React from 'react';
import Link from 'next/link';

type Props = {
  locale: string;
};

export function Navbar({ locale }: Props) {
  const isBn = locale === 'bn';
  const targetLocale = isBn ? 'en' : 'bn';

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
            🩺
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg text-foreground leading-tight">
              {isBn ? 'ডাঃ আরিফুল ইসলাম' : 'Dr. Ariful Islam'}
            </div>
            <div className="text-xs text-muted-foreground">
              {isBn ? 'মেডিসিন ও কার্ডিওলজি কনসালট্যান্ট' : 'Internal Medicine & Cardiology'}
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href={`/${locale}`} className="text-muted-foreground hover:text-foreground transition-colors">
            {isBn ? 'হোম' : 'Home'}
          </Link>
          <Link href={`/${locale}/services`} className="text-muted-foreground hover:text-foreground transition-colors">
            {isBn ? 'সেবাসমূহ' : 'Services'}
          </Link>
          <Link href={`/${locale}/chambers`} className="text-muted-foreground hover:text-foreground transition-colors">
            {isBn ? 'চেম্বার' : 'Chambers'}
          </Link>
          <Link href={`/${locale}/blog`} className="text-muted-foreground hover:text-foreground transition-colors">
            {isBn ? 'ব্লগ' : 'Blog'}
          </Link>
          <Link href={`/${locale}/contact`} className="text-muted-foreground hover:text-foreground transition-colors">
            {isBn ? 'যোগাযোগ' : 'Contact'}
          </Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            {isBn ? 'অ্যাডমিন' : 'Admin'}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/${targetLocale}`}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {isBn ? 'English' : 'বাংলা'}
          </Link>

          <Link
            href={`/${locale}/appointment`}
            className="rounded-md bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {isBn ? 'অ্যাপয়েন্টমেন্ট নিন' : 'Book Appointment'}
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
