import React from 'react';
import Link from 'next/link';
import { bn } from '@messages/bn';
import { en } from '@messages/en';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  const isBn = locale === 'bn';
  const dict = isBn ? bn : en;

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
          {dict.blog.title}
        </h1>
        <p className="text-muted-foreground text-base">
          {dict.blog.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {dict.blog.articles.map((art: { id: string; title: string; titleBn: string; excerpt: string; readingTime: string; slug: string; date: string }) => (
          <article
            key={art.id}
            className="rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-muted-foreground border-b pb-3">
                <span>📅 {art.date}</span>
                <span className="reading-time font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                  {art.readingTime}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-card-foreground">
                {isBn ? art.titleBn : art.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {art.excerpt}
              </p>
            </div>
            <div className="pt-6 border-t mt-6">
              <Link
                href={`/${locale}/blog/${art.slug}`}
                className="text-sm font-bold text-primary hover:underline"
              >
                {dict.common.readMore} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
