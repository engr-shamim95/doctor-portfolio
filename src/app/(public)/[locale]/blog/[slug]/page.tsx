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

export default async function BlogPostDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  const article = dict.blog.articles.find((a) => a.slug === slug);
  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href={`/${locale}/blog`} className="text-sm text-primary hover:underline font-medium">
          ← {isBn ? 'সব ব্লগ পোস্ট' : 'All Health Articles'}
        </Link>
      </div>

      <header className="space-y-4 border-b pb-6">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>📅 {article.date}</span>
          <span className="reading-time font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
            {article.readingTime}
          </span>
          <span>✍️ {dict.doctor.name}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {isBn ? article.titleBn : article.title}
        </h1>
        <p className="text-lg text-muted-foreground font-medium">{article.excerpt}</p>
      </header>

      <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed space-y-6 text-base">
        <p>
          {isBn
            ? 'স্বাস্থ্য সুরক্ষায় প্রাথমিক সচেতনতাই মূল ভূমিকা পালন করে। সঠিক খাদ্যাভ্যাস এবং নিয়মিত ব্যায়াম শরীরের মেটাবলিজম ও রক্ত সঞ্চালন স্বাভাবিক রাখতে সাহায্য করে।'
            : 'Early preventative awareness is the bedrock of holistic cardiovascular and metabolic wellness. Balanced nutritional intake coupled with consistent physical activity maintains optimal hemodynamic balance.'}
        </p>

        <h3 className="text-xl font-bold text-foreground">
          {isBn ? 'প্রধান লক্ষণসমূহ ও ডাক্তারের পরামর্শ' : 'Key Clinical Indicators & Advisory'}
        </h3>
        <p>
          {isBn
            ? 'যে কোনো দীর্ঘস্থায়ী লক্ষণকে অবহেলা না করে একজন রেজিস্টার্ড চিকিৎসকের পরামর্শ নেয়া জরুরি। স্বপ্রণোদিত হয়ে ওষুধ খাওয়া স্বাস্থ্যের জন্য মারাত্মক ঝুঁকিপূর্ণ হতে পারে।'
            : 'Never dismiss persistent symptoms. Consulting a verified, registered clinician guarantees accurate diagnosis and mitigates drug interaction hazards.'}
        </p>
      </div>

      <div className="rounded-2xl border bg-muted/40 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 mt-12">
        <div>
          <h3 className="font-bold text-foreground">
            {isBn ? 'ডাক্তারের সাথে সরাসরি পরামর্শের জন্য' : 'Consult with Dr. Ariful Islam'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isBn ? 'চেম্বারে সরাসরি সাক্ষাতের জন্য অনলাইন অ্যাপয়েন্টমেন্ট নিন।' : 'Reserve your slot at our diagnostic chambers.'}
          </p>
        </div>
        <Link
          href={`/${locale}/appointment`}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
        >
          {dict.common.appointment}
        </Link>
      </div>
    </article>
  );
}
