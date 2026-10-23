const fs = require('fs');
const path = require('path');

// Auto-load .env if DATABASE_URL is not already set
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
  const targetEmail = process.argv[2];

  if (targetEmail) {
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
    });

    if (!user) {
      console.error(`❌ User with email "${targetEmail}" was not found.`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { email: targetEmail },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Success! Granted ADMIN role to: ${updated.email} (${updated.name})`);
  } else {
    // If no email passed, find the first registered user and promote them
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!firstUser) {
      console.log('⚠️ No users found in database yet. Please register an account first at http://localhost:3000/register');
      process.exit(0);
    }

    const updated = await prisma.user.update({
      where: { id: firstUser.id },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Granted ADMIN role to earliest registered user: ${updated.email} (${updated.name})`);
    console.log(`💡 You can also specify an email: node scripts/make-admin.js your-email@example.com`);
  }
}

main()
  .catch((err) => {
    console.error('Error updating user role:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
