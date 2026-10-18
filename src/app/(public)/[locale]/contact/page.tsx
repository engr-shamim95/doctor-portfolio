import React from 'react';
import { bn } from '@messages/bn';
import { en } from '@messages/en';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  const faqs = [
    {
      q: isBn ? 'অনলাইনে কীভাবে অ্যাপয়েন্টমেন্ট বুক করব?' : 'How do I book an appointment online?',
      a: isBn
        ? 'অ্যাপয়েন্টমেন্ট পেজে গিয়ে পছন্দের চেম্বার, তারিখ ও সময় নির্বাচন করুন। এরপর নাম ও ফোন নম্বর দিয়ে ওটিপি যাচাই করলেই কনফার্মেশন পাবেন।'
        : 'Visit our Appointment page, choose your preferred chamber, date, and time slot. Enter your contact details and verify via OTP to confirm your booking.',
    },
    {
      q: isBn ? 'বুকিং বাতিল বা পরিবর্তন কীভাবে করব?' : 'How can I reschedule or cancel my booking?',
      a: isBn
        ? 'বুকিং সম্পন্ন হলে আপনার ফোনে একটি গোপন ম্যানেজমেন্ট লিংক পাঠানো হবে। সেই লিংকে ক্লিক করে এক ক্লিকেই বুকিং বাতিল করতে পারবেন।'
        : 'Upon confirmation, you receive a secure signed management link. Clicking that link allows instant one-click self-cancellation.',
    },
    {
      q: isBn ? 'জরুরি অবস্থায় কী করব?' : 'What should I do in an emergency?',
      a: isBn
        ? 'অনলাইন বুকিং পোর্টাল জরুরি সেবার জন্য নয়। জরুরি পরিস্থিতিতে অবিলম্বে নিকটস্থ জরুরি বিভাগে যোগাযোগ করুন অথবা ৯৯৯ এ কল করুন।'
        : 'Our booking portal is strictly for non-acute consultations. For sudden emergencies, call 999 or proceed immediately to the nearest emergency room.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {isBn ? 'যোগাযোগ ও সচরাচর জিজ্ঞাসা (Contact & FAQ)' : 'Contact & FAQ'}
        </h1>
        <p className="text-muted-foreground text-base">
          {isBn
            ? 'যে কোনো অনুসন্ধান বা চেম্বার সংক্রান্ত তথ্যের জন্য সরাসরি যোগাযোগ করুন।'
            : 'Get in touch for chamber visiting information or clinic inquiries.'}
        </p>
      </div>

      {/* Emergency Disclaimer Banner */}
      <div className="emergency-disclaimer rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-center text-amber-900 dark:text-amber-200 text-sm font-semibold">
        {dict.common.emergencyNotice}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact Form */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-card-foreground">
            {isBn ? 'বার্তা পাঠান' : 'Send a Message'}
          </h2>

          <form id="contact-form" className="space-y-4">
            {/* Anti-spam Honeypot field */}
            <input
              type="text"
              name="honeypot"
              style={{ display: 'none' }}
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {isBn ? 'আপনার নাম' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                placeholder={isBn ? 'যেমন: মোহাম্মদ রাহিম' : 'e.g. John Doe'}
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
              </label>
              <input
                type="tel"
                required
                placeholder="01700000000"
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {isBn ? 'আপনার বার্তা' : 'Message'}
              </label>
              <textarea
                rows={4}
                required
                placeholder={isBn ? 'আপনার বার্তা লিখুন...' : 'Write your message here...'}
                className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
            >
              {isBn ? 'বার্তা পাঠান' : 'Submit Inquiry'}
            </button>
          </form>
        </div>

        {/* FAQs */}
        <div className="faq-list space-y-6">
          <h3 className="text-2xl font-bold text-foreground">
            {isBn ? 'সচরাচর জিজ্ঞাসিত প্রশ্নোত্তর' : 'Frequently Asked Questions'}
          </h3>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6 space-y-2">
                <h4 className="font-bold text-base text-card-foreground">
                  {faq.q}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-primary/5 border-primary/20 p-6 space-y-2">
            <h4 className="font-bold text-base text-primary">
              {isBn ? 'জরুরি সিরিয়ালের জন্য সরাসরি কল করুন' : 'Need urgent serial assistance?'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {isBn ? 'চেম্বার অ্যাসিস্ট্যান্ট সরাসরি ফোন বুকিংয়ে সহায়তা করবেন:' : 'Our clinic reception will assist by telephone:'}
            </p>
            <div className="font-mono font-bold text-lg text-foreground">
              +8801700112233 / +8801700223344
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
