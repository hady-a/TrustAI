import * as dotenv from 'dotenv';
import { db } from '../src/db/index';
import { users } from '../src/db/schema/users';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';

dotenv.config();

async function seedAdminUser() {
  try {
    console.log('🌱 Seeding database with initial admin user...');

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(or(eq(users.role, 'ADMIN'), eq(users.email, 'admin@trustai.local')));

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists. Skipping seed.');
      return;
    }

    // Hash the default password
    const defaultPassword = 'admin123'; // Change this to a secure password in production!
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@trustai.local',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      })
      .returning();

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 Admin Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change this password immediately in production!');
    console.log('');
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdminUser().then(() => {
  console.log('✨ Seeding complete!');
  process.exit(0);
});
