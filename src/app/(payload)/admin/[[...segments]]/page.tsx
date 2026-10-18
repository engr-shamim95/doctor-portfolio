/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import config from '@payload-config';
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';

type Args = {
  params: Promise<{
    segments?: string[];
  }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export const generateMetadata = async ({ params, searchParams }: Args) =>
  generatePageMetadata({
    config,
    params: params as any,
    searchParams: (searchParams ?? Promise.resolve({})) as any,
  });

const Page = async ({ params, searchParams }: Args) => {
  return RootPage({
    config,
    params: params as any,
    searchParams: (searchParams ?? Promise.resolve({})) as any,
    importMap: {},
  });
};

export default Page;
