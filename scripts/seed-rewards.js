const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_REWARDS = [
  {
    title: "$5 Amazon Gift Card",
    brand: "Amazon",
    description: "Redeemable for millions of items store-wide on Amazon. Delivered via digital code.",
    countryCode: "US",
    currency: "USD",
    faceValue: 5.0,
    coinsCost: 5000,
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=300&q=80",
  },
  {
    title: "$10 Amazon Gift Card",
    brand: "Amazon",
    description: "Redeemable for millions of items store-wide on Amazon. Delivered via digital code.",
    countryCode: "US",
    currency: "USD",
    faceValue: 10.0,
    coinsCost: 10000,
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=300&q=80",
  },
  {
    title: "$5 Apple Gift Card",
    brand: "Apple",
    description: "Use for apps, games, music, movies, iCloud storage, and Apple products.",
    countryCode: "US",
    currency: "USD",
    faceValue: 5.0,
    coinsCost: 5000,
    imageUrl: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&q=80",
  },
  {
    title: "$10 Google Play Gift Card",
    brand: "Google Play",
    description: "Explore millions of games, apps, movies, and books on Google Play.",
    countryCode: "GLOBAL",
    currency: "USD",
    faceValue: 10.0,
    coinsCost: 10000,
    imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300&q=80",
  },
  {
    title: "$5 Litecoin (LTC) Crypto Payout",
    brand: "Crypto",
    description: "Ultra-fast cryptocurrency payout directly to any personal non-custodial LTC wallet address. Low network fees.",
    countryCode: "GLOBAL",
    currency: "USD",
    faceValue: 5.0,
    coinsCost: 5000,
    imageUrl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=300&q=80",
  },
  {
    title: "$10 USDT (TRC-20 / Polygon)",
    brand: "Tether",
    description: "Instant stablecoin payout sent directly to your web3 wallet or exchange address.",
    countryCode: "GLOBAL",
    currency: "USD",
    faceValue: 10.0,
    coinsCost: 10000,
    imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=300&q=80",
  },
];

async function seed() {
  console.log("🌱 Seeding initial reward catalogue...");

  for (const reward of DEFAULT_REWARDS) {
    const existing = await prisma.giftCardProduct.findFirst({
      where: { title: reward.title },
    });

    if (!existing) {
      await prisma.giftCardProduct.create({ data: reward });
      console.log(` Created: ${reward.title}`);
    } else {
      console.log(` Already exists: ${reward.title}`);
    }
  }

  console.log(" Seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
