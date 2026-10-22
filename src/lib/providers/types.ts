export interface OfferRewardEvent {
  userId: string;
  coinsToAdd: number;
  externalTxId: string;
  provider: string;
  offerTitle?: string;
  isReversal?: boolean;
  rawPayload?: any;
}

export interface VerificationResult {
  isValid: boolean;
  reason?: string;
  event?: OfferRewardEvent;
}

export interface OfferwallProviderAdapter {
  id: string;
  name: string;
  type: "SURVEY" | "OFFER";
  
  /**
   * Generates a secure, tracking-ready iframe or redirect URL populated with the user's ID
   */
  generateLaunchUrl(userId: string, userCountry?: string): string;

  /**
   * Validates the incoming webhook signature/hash from the provider
   */
  verifyPostback(params: URLSearchParams | Record<string, any>, rawBody?: string): Promise<VerificationResult>;
}
