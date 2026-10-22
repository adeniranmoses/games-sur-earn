const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Auto-load .env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[match[1]]) process.env[match[1]] = val;
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'sarahjoy45@gmail.com';
  const newPassword = process.argv[3] || 'Password123!';

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ User with email "${email}" not found.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });

  console.log(`✅ Success! Password for ${email} has been updated.`);
  console.log(`👉 Email: ${email}`);
  console.log(`👉 New Password: ${newPassword}`);
}

main()
  .catch((err) => {
    console.error('Error resetting password:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
