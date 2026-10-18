import React from 'react';
import Link from 'next/link';

type Props = {
  locale: string;
};

export function StickyMobileActionBar({ locale }: Props) {
  const isBn = locale === 'bn';

  return (
    <div
      className="sticky-mobile-action-bar fixed bottom-0 left-0 right-0 z-50 flex sm:hidden items-center justify-around bg-background/95 backdrop-blur border-t border-border p-2 shadow-lg"
      data-mobile="true"
    >
      <a
        href="tel:+8801700112233"
        className="btn-call flex-1 mx-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors text-center"
      >
        <span className="text-base">📞</span>
        <span>{isBn ? 'কল করুন' : 'Call'}</span>
      </a>

      <a
        href="https://wa.me/8801700112233"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-whatsapp flex-1 mx-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors text-center"
      >
        <span className="text-base">💬</span>
        <span>{isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
      </a>

      <Link
        href={`/${locale}/appointment`}
        className="btn-book flex-1 mx-1 flex flex-col items-center justify-center py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors text-center"
      >
        <span className="text-base">📅</span>
        <span>{isBn ? 'বুকিং' : 'Book'}</span>
      </Link>
    </div>
  );
}

export default StickyMobileActionBar;
