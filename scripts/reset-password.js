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
const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient(
  connectionUrl ? { datasources: { db: { url: connectionUrl } } } : undefined
);

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node scripts/reset-password.js <email> <newPassword>');
    process.exit(1);
  }

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
    data: {
      passwordHash,
      emailVerified: true,
      accountStatus: 'ACTIVE',
    },
  });

  console.log(`✅ Success! Password for ${email} has been updated.`);
  console.log(`👉 Email: ${email}`);
  console.log(`👉 New Password: ${newPassword}`);
  console.log(`👉 Email Verified: true`);
  console.log(`👉 Account Status: ACTIVE`);
}

main()
  .catch((err) => {
    console.error('Error resetting password:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
