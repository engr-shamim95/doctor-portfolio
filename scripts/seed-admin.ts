import 'dotenv/config';
import config from '../src/payload.config';
import { getPayload } from 'payload';

async function seedAdmin() {
  console.log('Connecting to database...');
  console.log('DATABASE_URI:', process.env.DATABASE_URI);
  try {
    const payload = await getPayload({ config });
    console.log('Payload initialized!');

    const existingUsers = await payload.find({
      collection: 'users',
    });
    console.log('Existing users count:', existingUsers.totalDocs);

    if (existingUsers.totalDocs === 0) {
      console.log('Creating initial Super Admin user...');
      const admin = await payload.create({
        collection: 'users',
        data: {
          email: 'admin@doctorcare.com',
          password: 'AdminPassword123!#',
          name: 'ডাঃ আরিফুল ইসলাম',
          role: 'super-admin',
          phone: '+8801700112233',
          isActive: true,
        },
      });
      console.log('✅ Super Admin created successfully:', admin.email);
    } else {
      console.log('Users already exist:', existingUsers.docs.map(u => u.email));
    }
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
  }
  process.exit(0);
}

seedAdmin();
