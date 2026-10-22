export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  countryCode: string;
  referralCode: string;
  referredByCode?: string | null;
  referralCount: number;
  referralEarningsCoins: number;
  createdAt: string;
  availableCoins: number;
  pendingCoins: number;
  tickets: number;
  currentStreak: number;
  longestStreak: number;
}

export interface PartnerCardData {
  id: string;
  name: string;
  type: "SURVEY" | "OFFER";
  rating: number;
  bonusPercent?: number;
  tag: string;
  logoUrl?: string;
  category: string;
  isUnlocked: boolean;
}

export interface QuestItemData {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category?: string;
  rewardType: "TICKETS" | "CASH" | "COINS";
  rewardAmount?: number;
  rewardValue: string;
  actionLabel: string;
  actionUrl?: string | null;
  completed: boolean;
  canClaim?: boolean;
  isRecurring?: boolean;
  hoursUntilNextStreak?: number;
  iconName: "social" | "streak" | "bell" | "survey";
}
