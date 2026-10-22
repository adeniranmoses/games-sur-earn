const fs = require('fs');
const path = require('path');

// Auto-load .env
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

const DEFAULT_QUESTS = [
  {
    slug: 'quest-streak-daily',
    title: 'Daily Login Check-In & Streak',
    description: 'Visit FreeRewards every 24 hours to keep your streak alive and claim free cash bonus coins.',
    category: 'DAILY',
    rewardType: 'COINS',
    rewardAmount: 100, // 100 coins = $0.10
    rewardDisplay: '$0.10 Cash',
    actionLabel: 'Claim Daily Streak',
    actionUrl: null,
    iconName: 'streak',
    isRecurring: true,
    cooldownHours: 24,
    sortOrder: 1,
  },
  {
    slug: 'quest-follow-twitter',
    title: 'Follow FreeRewards on Twitter / X',
    description: 'Stay up to date with new 2x multiplier weekend events and free promo codes.',
    category: 'SOCIAL',
    rewardType: 'TICKETS',
    rewardAmount: 40,
    rewardDisplay: '40 Tickets',
    actionLabel: 'Follow @FreeRewards',
    actionUrl: 'https://twitter.com',
    iconName: 'social',
    isRecurring: false,
    cooldownHours: 0,
    sortOrder: 2,
  },
  {
    slug: 'quest-enable-notifications',
    title: 'Enable Browser Push Notifications',
    description: 'Get notified instantly when high-paying $20+ game testing offers and surveys drop.',
    category: 'SYSTEM',
    rewardType: 'TICKETS',
    rewardAmount: 25,
    rewardDisplay: '25 Tickets',
    actionLabel: 'Enable Notifications',
    actionUrl: null,
    iconName: 'bell',
    isRecurring: false,
    cooldownHours: 0,
    sortOrder: 3,
  },
  {
    slug: 'quest-join-telegram',
    title: 'Join FreeRewards Telegram Channel',
    description: 'Connect with global earners, get exclusive weekend promo codes, and drop feedback.',
    category: 'SOCIAL',
    rewardType: 'TICKETS',
    rewardAmount: 30,
    rewardDisplay: '30 Tickets',
    actionLabel: 'Join Telegram',
    actionUrl: 'https://telegram.org',
    iconName: 'social',
    isRecurring: false,
    cooldownHours: 0,
    sortOrder: 4,
  },
];

async function seed() {
  console.log('🌱 Seeding quests into database...');

  for (const q of DEFAULT_QUESTS) {
    const existing = await prisma.quest.findUnique({
      where: { slug: q.slug },
    });

    if (!existing) {
      await prisma.quest.create({ data: q });
      console.log(` Created quest: ${q.title} (${q.rewardDisplay})`);
    } else {
      await prisma.quest.update({
        where: { slug: q.slug },
        data: q,
      });
      console.log(` Updated quest: ${q.title}`);
    }
  }

  console.log('✅ Quests seeded successfully!');
}

seed()
  .catch((err) => {
    console.error('❌ Error seeding quests:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
