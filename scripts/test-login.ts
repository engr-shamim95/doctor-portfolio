import 'dotenv/config';
import config from '../src/payload.config';
import { getPayload } from 'payload';

async function testLogin() {
  const payload = await getPayload({ config });
  try {
    const result = await payload.login({
      collection: 'users',
      data: {
        email: 'admin@doctorcare.com',
        password: 'AdminPassword123!#',
      },
    });
    console.log('LOGIN SUCCESSFUL! User:', result.user?.email, 'Token exists:', Boolean(result.token));
  } catch (err) {
    console.error('LOGIN FAILED:', err);
  }
  process.exit(0);
}

testLogin();
