'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type Props = {
  locale: string;
};

export function Navbar({ locale }: Props) {
  const isBn = locale === 'bn';
  const targetLocale = isBn ? 'en' : 'bn';
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href={`/${locale}`} onClick={closeMenu} className="flex items-center gap-2">
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

        {/* Desktop Navigation */}
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

        {/* Action Controls & Hamburger Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/${targetLocale}`}
            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {isBn ? 'English' : 'বাংলা'}
          </Link>

          <Link
            href={`/${locale}/appointment`}
            className="hidden sm:inline-flex rounded-md bg-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            {isBn ? 'অ্যাপয়েন্টমেন্ট নিন' : 'Book Appointment'}
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {isOpen ? (
              <span className="text-xl leading-none font-bold">✕</span>
            ) : (
              <span className="text-xl leading-none font-bold">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b bg-background/98 px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-2 text-base font-medium">
            <Link
              href={`/${locale}`}
              onClick={closeMenu}
              className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
            >
              🏠 {isBn ? 'হোম' : 'Home'}
            </Link>
            <Link
              href={`/${locale}/services`}
              onClick={closeMenu}
              className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
            >
              🩺 {isBn ? 'সেবাসমূহ' : 'Services'}
            </Link>
            <Link
              href={`/${locale}/chambers`}
              onClick={closeMenu}
              className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
            >
              🏥 {isBn ? 'চেম্বার ও সময়সূচী' : 'Chambers'}
            </Link>
            <Link
              href={`/${locale}/blog`}
              onClick={closeMenu}
              className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
            >
              📰 {isBn ? 'স্বাস্থ্য ব্লগ' : 'Health Blog'}
            </Link>
            <Link
              href={`/${locale}/contact`}
              onClick={closeMenu}
              className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors"
            >
              📞 {isBn ? 'যোগাযোগ ও প্রশ্ন' : 'Contact & FAQ'}
            </Link>
            <Link
              href="/admin"
              onClick={closeMenu}
              className="px-3 py-2 rounded-md hover:bg-muted text-foreground transition-colors border-t pt-3"
            >
              ⚙️ {isBn ? 'অ্যাডমিন পোর্টাল' : 'Admin Portal'}
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href={`/${locale}/appointment`}
              onClick={closeMenu}
              className="w-full inline-flex items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              📅 {isBn ? 'অনলাইন বুকিং করুন' : 'Book Appointment'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
