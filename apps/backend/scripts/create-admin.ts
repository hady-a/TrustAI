import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { db } from '../src/db/index';
import { users } from '../src/db/schema/users';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminInteractive() {
  try {
    console.log('\n🔐 TrustAI Admin Account Setup\n');

    // Get admin details from user
    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Admin Password: ');
    const confirmPassword = await question('Confirm Password: ');

    // Validate inputs
    if (!name || !email || !password) {
      console.error('❌ All fields are required!');
      rl.close();
      process.exit(1);
    }

    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters long!');
      rl.close();
      process.exit(1);
    }

    if (!email.includes('@')) {
      console.error('❌ Invalid email format!');
      rl.close();
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      console.error(`❌ User with email "${email}" already exists!`);
      rl.close();
      process.exit(1);
    }

    // Hash password
    console.log('\n🔒 Processing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        isActive: true,
      })
      .returning();

    console.log('\n✅ Admin user created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Created: ${adminUser.createdAt}\n`);

    rl.close();
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    rl.close();
    process.exit(1);
  }
}

createAdminInteractive().then(() => {
  console.log('✨ Setup complete!\n');
  process.exit(0);
});
