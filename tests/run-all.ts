import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  console.log('🔍 Discovering E2E test files across Tiers 1-4...');
  const files = globSync('tests/e2e/**/*.test.ts').map((f) => resolve(f));

  if (files.length === 0) {
    console.error('❌ No test files found in tests/e2e/**/*.test.ts');
    process.exit(1);
  }

  console.log(`📋 Found ${files.length} test suites. Executing E2E test runner...\n`);

  const testStream = run({
    files,
    concurrency: false, // Run sequentially for predictable output
  });

  testStream.compose(new spec()).pipe(process.stdout);

  testStream.on('error', (err) => {
    console.error('Test stream error:', err);
    process.exit(1);
  });

  testStream.on('end', () => {
    // node:test spec reporter outputs the summary at the end
  });
}

main().catch((err) => {
  console.error('Runner failed:', err);
  process.exit(1);
});
