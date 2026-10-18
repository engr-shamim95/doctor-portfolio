import { Hind_Siliguri, Inter } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

export const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  display: 'swap',
  variable: '--font-hind-siliguri',
  weight: ['300', '400', '500', '600', '700'],
});
