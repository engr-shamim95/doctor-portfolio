import React from 'react';

type Props = {
  locale: string;
};

export function EmergencyBanner({ locale }: Props) {
  const isBn = locale === 'bn';

  return (
    <div className="emergency-disclaimer emergency-disclaimer-banner bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs sm:text-sm text-center font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
          {isBn ? '⚠️ জরুরি বিজ্ঞপ্তি:' : '⚠️ Emergency Notice:'}
        </span>
        <span>
          {isBn
            ? 'জরুরী চিকিৎসা সেবার জন্য অনুগ্রহ করে অবিলম্বে নিকটস্থ হাসপাতালে যান অথবা ৯৯৯ এ কল করুন। এই অনলাইন পোর্টাল জরুরী সেবার জন্য নয়।'
            : 'For emergencies, please call 999 or visit the nearest emergency room immediately. This online appointment system is not intended for acute emergency care.'}
        </span>
      </div>
    </div>
  );
}

export default EmergencyBanner;
