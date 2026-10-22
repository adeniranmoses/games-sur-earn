const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function init() {
  console.log('Connecting to database...');
  
  const ddlStatements = [
    `DO $$ BEGIN
       CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION');
     EXCEPTION WHEN duplicate_object THEN null;
     END $$;`,

    `DO $$ BEGIN
       CREATE TYPE "TransactionType" AS ENUM ('OFFER_REWARD', 'SURVEY_REWARD', 'REFERRAL_REWARD', 'WITHDRAWAL', 'WITHDRAWAL_FEE', 'REVERSAL', 'ADMIN_CREDIT', 'ADMIN_DEBIT');
     EXCEPTION WHEN duplicate_object THEN null;
     END $$;`,

    `DO $$ BEGIN
       CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVERSED', 'PAID');
     EXCEPTION WHEN duplicate_object THEN null;
     END $$;`,

    `CREATE TABLE IF NOT EXISTS "User" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "name" TEXT NOT NULL,
       "email" TEXT NOT NULL UNIQUE,
       "emailVerified" BOOLEAN NOT NULL DEFAULT false,
       "phone" TEXT,
       "country" TEXT NOT NULL DEFAULT 'NG',
       "passwordHash" TEXT NOT NULL,
       "referralCode" TEXT NOT NULL UNIQUE,
       "referredById" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
       "accountStatus" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
       "riskScore" INTEGER NOT NULL DEFAULT 0,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
     );`,

    `CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");`,
    `CREATE INDEX IF NOT EXISTS "User_referralCode_idx" ON "User"("referralCode");`,

    `CREATE TABLE IF NOT EXISTS "Wallet" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
       "availableBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
       "pendingBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
       "lifetimeEarnings" DECIMAL(65,30) NOT NULL DEFAULT 0,
       "lifetimeWithdrawals" DECIMAL(65,30) NOT NULL DEFAULT 0,
       "currency" TEXT NOT NULL DEFAULT 'NGN',
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
     );`,

    `CREATE INDEX IF NOT EXISTS "Wallet_userId_idx" ON "Wallet"("userId");`,

    `CREATE TABLE IF NOT EXISTS "WalletTransaction" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "walletId" TEXT NOT NULL REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
       "type" "TransactionType" NOT NULL,
       "amount" DECIMAL(65,30) NOT NULL,
       "currency" TEXT NOT NULL DEFAULT 'NGN',
       "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
       "description" TEXT NOT NULL,
       "provider" TEXT,
       "externalTxId" TEXT,
       "referenceId" TEXT UNIQUE,
       "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
       "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
     );`,

    `CREATE INDEX IF NOT EXISTS "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");`,
    `CREATE INDEX IF NOT EXISTS "WalletTransaction_externalTxId_idx" ON "WalletTransaction"("externalTxId");`,
    `CREATE INDEX IF NOT EXISTS "WalletTransaction_status_idx" ON "WalletTransaction"("status");`
  ];

  for (const sql of ddlStatements) {
    await prisma.$executeRawUnsafe(sql);
  }

  console.log('✅ Database tables and enums initialized successfully!');
  const userCount = await prisma.user.count();
  console.log('Current users count:', userCount);
}

init()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
