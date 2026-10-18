import nextEnv from '@next/env';

// Pre-load environment files in standard Next.js precedence order
const projectDir = process.cwd();
const loadEnvConfig = (nextEnv as any).loadEnvConfig || (nextEnv as any).default?.loadEnvConfig;
loadEnvConfig(projectDir);

async function runEnvVerification() {
  console.log('🔍 Validating environment variables against Zod schema...');

  try {
    // Dynamic import ensures process.env is populated by loadEnvConfig first
    const { validateEnv } = await import('../src/env');
    const validated = validateEnv();

    console.log('\n=============================================================');
    console.log('✅ ENVIRONMENT VALIDATION PASSED');
    console.log('=============================================================');
    console.log(`▸ Environment:        ${validated.NODE_ENV}`);
    console.log(`▸ Server Port:        ${validated.PORT}`);
    console.log(`▸ Database Host:      ${validated.DATABASE_URI.replace(/:[^:@]*@/, ':****@')}`);
    console.log(`▸ Public Server URL:  ${validated.NEXT_PUBLIC_SERVER_URL}`);
    console.log(`▸ Timezone:           ${validated.NEXT_PUBLIC_APP_TIMEZONE}`);
    console.log(`▸ Default Locale:     ${validated.NEXT_PUBLIC_DEFAULT_LOCALE}`);
    console.log(`▸ OTP Provider:       ${validated.OTP_PROVIDER} (TTL: ${validated.OTP_EXPIRY_SECONDS}s)`);
    console.log(`▸ WhatsApp Hotline:   ${validated.NEXT_PUBLIC_WHATSAPP_NUMBER}`);
    console.log('=============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Environment verification failed.');
    console.error('Please check the error output above and update your .env file.\n');
    process.exit(1);
  }
}

runEnvVerification();
