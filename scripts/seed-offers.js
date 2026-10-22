const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SAMPLE_OFFERS = [
  {
    provider: "bitlabs_preview",
    title: "Mafia City: Level 15 Stronghold",
    description: "Install, complete the tutorial, and upgrade your Mansion to Level 15 within 14 days.",
    category: "GAME",
    difficulty: "Medium",
    rewardCoins: 4500, // $4.50
    timeEstimate: "~4 days",
    device: "ANDROID",
    countryCode: "GLOBAL",
    instructions: "1. Download via our tracking link.\n2. Complete the tutorial.\n3. Reach Mansion Level 15.\n4. Coins credit automatically within 1 hour.",
    iconUrl: "game",
  },
  {
    provider: "cpxresearch_preview",
    title: "Global Consumer Tech Survey",
    description: "Share your opinions on recent electronic purchases and technology preferences.",
    category: "SURVEY",
    difficulty: "Easy",
    rewardCoins: 850, // $0.85
    timeEstimate: "~8 mins",
    device: "ALL",
    countryCode: "GLOBAL",
    instructions: "1. Answer the qualification questions honestly.\n2. Complete all survey questions until the final confirmation screen.",
    iconUrl: "survey",
  },
  {
    provider: "lootably_preview",
    title: "Revolut / Fintech Sign-Up & ID Check",
    description: "Open a free account and complete basic identity verification.",
    category: "APP",
    difficulty: "Easy",
    rewardCoins: 3200, // $3.20
    timeEstimate: "~10 mins",
    device: "ALL",
    countryCode: "GLOBAL",
    instructions: "1. Register an account.\n2. Verify email and phone number.\n3. Complete quick ID verification.",
    iconUrl: "app",
  },
  {
    provider: "mock_provider",
    title: "Watch & Rate Video Advertisements",
    description: "Watch 5 sponsored short clips and answer a 1-question brand rating.",
    category: "VIDEO",
    difficulty: "Easy",
    rewardCoins: 250, // $0.25
    timeEstimate: "~4 mins",
    device: "ALL",
    countryCode: "GLOBAL",
    instructions: "1. Watch the video without skipping.\n2. Submit your rating at the end.",
    iconUrl: "video",
  },
  {
    provider: "torox_preview",
    title: "Solitaire Grand Harvest: Crop 11",
    description: "Harvest your first 11 fields by playing through levels.",
    category: "GAME",
    difficulty: "Easy",
    rewardCoins: 1800, // $1.80
    timeEstimate: "~2 days",
    device: "IOS",
    countryCode: "GLOBAL",
    instructions: "1. Install the game for the first time.\n2. Reach Crop 11.\n3. Rewards credited automatically.",
    iconUrl: "game",
  },
  {
    provider: "cpxresearch_preview",
    title: "Automotive & Commuter Trends Survey",
    description: "A quick 12-question study for daily commuters and car owners.",
    category: "SURVEY",
    difficulty: "Easy",
    rewardCoins: 600, // $0.60
    timeEstimate: "~6 mins",
    device: "ALL",
    countryCode: "GLOBAL",
    instructions: "1. Must complete the entire survey to be eligible for reward credit.",
    iconUrl: "survey",
  },
];

async function seed() {
  console.log("🌱 Seeding initial marketplace offers...");

  for (const offer of SAMPLE_OFFERS) {
    const existing = await prisma.offer.findFirst({
      where: { title: offer.title },
    });

    if (!existing) {
      await prisma.offer.create({ data: offer });
      console.log(` Created offer: ${offer.title}`);
    } else {
      console.log(` Already exists: ${offer.title}`);
    }
  }

  console.log(" Offers seeding completed!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
