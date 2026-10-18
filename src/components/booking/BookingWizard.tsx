'use client';

import React, { useState } from 'react';

type Props = {
  locale: string;
};

export function BookingWizard({ locale }: Props) {
  const isBn = locale === 'bn';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedChamber, setSelectedChamber] = useState('chamber-dhanmondi-1');
  const [selectedDate, setSelectedDate] = useState('2026-10-25');
  const [selectedSlot, setSelectedSlot] = useState('17:00');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chambers = [
    {
      id: 'chamber-dhanmondi-1',
      name: isBn ? 'ধানমন্ডি চেম্বার (স্লট বুকিং)' : 'Dhanmondi Chamber (Slot Booking)',
      mode: 'SLOT',
      hours: '5:00 PM - 9:00 PM',
    },
    {
      id: 'chamber-uttara-2',
      name: isBn ? 'উত্তরা চেম্বার (সিরিয়াল বুকিং)' : 'Uttara Chamber (Serial Booking)',
      mode: 'SERIAL',
      hours: '6:00 PM - 10:00 PM',
    },
  ];

  const slots = ['17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30'];

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulating reserve API call
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulating OTP verification API call
    setTimeout(() => {
      setIsSubmitting(false);
      setReferenceCode(`DOC-20261025-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
      setStep(4);
    }, 600);
  };

  return (
    <div id="booking-wizard" className="w-full max-w-2xl mx-auto rounded-3xl border bg-card p-6 sm:p-10 shadow-lg space-y-8">
      {/* Steps indicator */}
      <div className="flex items-center justify-between border-b pb-6 text-xs sm:text-sm font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          <span className="h-6 w-6 rounded-full border flex items-center justify-center">1</span>
          <span>{isBn ? 'চেম্বার ও সময়' : 'Slot'}</span>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          <span className="h-6 w-6 rounded-full border flex items-center justify-center">2</span>
          <span>{isBn ? 'রোগীর তথ্য' : 'Patient'}</span>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          <span className="h-6 w-6 rounded-full border flex items-center justify-center">3</span>
          <span>{isBn ? 'ওটিপি' : 'OTP'}</span>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className={`flex items-center gap-2 ${step >= 4 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
          <span className="h-6 w-6 rounded-full border flex items-center justify-center">4</span>
          <span>{isBn ? 'কনফার্ম' : 'Done'}</span>
        </div>
      </div>

      {/* Step 1: Select Chamber, Date, Slot */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              {isBn ? '১. চেম্বার নির্বাচন করুন' : '1. Select Chamber'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chambers.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setSelectedChamber(ch.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    selectedChamber === ch.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary text-primary font-bold'
                      : 'border-border bg-card hover:bg-muted text-card-foreground'
                  }`}
                >
                  <div className="text-sm">{ch.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{ch.hours}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              {isBn ? '২. তারিখ নির্বাচন করুন' : '2. Select Appointment Date'}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">
              {isBn ? '৩. ফাঁকা সময় (স্লট) বেছে নিন' : '3. Select Available Slot'}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSlot(s)}
                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-semibold transition-all ${
                    selectedSlot === s
                      ? 'border-primary bg-primary text-primary-foreground shadow'
                      : 'border-border bg-muted/30 hover:bg-muted text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all mt-4"
          >
            {isBn ? 'পরবর্তী ধাপ (রোগীর তথ্য)' : 'Continue to Patient Details'} →
          </button>
        </div>
      )}

      {/* Step 2: Patient Info */}
      {step === 2 && (
        <form onSubmit={handleReserve} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">
                {isBn ? 'রোগীর পূর্ণ নাম' : 'Patient Full Name'}
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={isBn ? 'যেমন: মোহাম্মদ রাহিম' : 'e.g. John Doe'}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-foreground">
                {isBn ? 'মোবাইল নম্বর (ওটিপি পাঠানো হবে)' : 'Mobile Phone (OTP will be sent)'}
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="01700112233"
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">{isBn ? 'বুকিং সারাংশ:' : 'Booking Summary:'}</div>
            <div>🏥 {selectedChamber}</div>
            <div>📅 {selectedDate} | ⏰ {selectedSlot}</div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-accent transition-colors"
            >
              ← {isBn ? 'পেছনে' : 'Back'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
            >
              {isSubmitting
                ? (isBn ? 'ওটিপি পাঠানো হচ্ছে...' : 'Sending OTP...')
                : (isBn ? 'ওটিপি পাঠান (Send OTP)' : 'Send Verification OTP')}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: OTP Verification */}
      {step === 3 && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-3xl">📱</div>
            <h3 className="text-lg font-bold text-foreground">
              {isBn ? 'মোবাইল নম্বর যাচাইকরণ' : 'Verify Mobile OTP'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isBn
                ? `${patientPhone} নম্বরে ৬ সংখ্যার ওটিপি কোড পাঠানো হয়েছে (ডেমো কোড: 123456)`
                : `Enter 6-digit code sent to ${patientPhone} (demo code: 123456)`}
            </p>
          </div>

          <div className="max-w-xs mx-auto">
            <input
              type="text"
              maxLength={6}
              required
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="w-full rounded-xl border bg-background px-4 py-3 text-center text-2xl tracking-widest font-mono font-bold outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-accent transition-colors"
            >
              ← {isBn ? 'পেছনে' : 'Back'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
            >
              {isSubmitting
                ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                : (isBn ? 'বুকিং নিশ্চিত করুন' : 'Confirm Appointment')}
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Success Confirmation */}
      {step === 4 && (
        <div className="text-center space-y-6 py-4">
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto border border-emerald-500/20">
            ✓
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              {isBn ? 'অ্যাপয়েন্টমেন্ট সফলভাবে নিশ্চিত হয়েছে!' : 'Appointment Confirmed Successfully!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isBn
                ? 'আপনার বুকিং রেফারেন্স কোড এবং বিস্তারিত নিচে দেওয়া হলো।'
                : 'Your booking has been registered in our clinic queue system.'}
            </p>
          </div>

          <div className="rounded-2xl border bg-muted/30 p-6 max-w-md mx-auto space-y-3 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs text-muted-foreground">{isBn ? 'রেফারেন্স কোড:' : 'Reference Code:'}</span>
              <span className="font-mono font-bold text-primary text-base">{referenceCode}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{isBn ? 'রোগীর নাম:' : 'Patient Name:'}</span>
              <span className="font-semibold text-foreground">{patientName}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{isBn ? 'তারিখ ও সময়:' : 'Date & Time:'}</span>
              <span className="font-semibold text-foreground">{selectedDate} at {selectedSlot}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{isBn ? 'চেম্বার:' : 'Chamber:'}</span>
              <span className="font-semibold text-foreground">Dhanmondi Chamber</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isBn
              ? 'একটি নিশ্চিতকরণ এসএমএস আপনার নম্বরে পাঠানো হয়েছে, যার মধ্যে অ্যাপয়েন্টমেন্ট বাতিল বা পরিবর্তনের সিকিউর লিংক রয়েছে।'
              : 'A confirmation SMS with your secure cancellation link has been sent to your phone.'}
          </div>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setPatientName('');
              setPatientPhone('');
              setOtpCode('');
            }}
            className="rounded-xl border px-6 py-2.5 text-xs font-semibold hover:bg-accent transition-colors"
          >
            {isBn ? 'নতুন আরেকটি বুকিং করুন' : 'Book Another Appointment'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BookingWizard;
