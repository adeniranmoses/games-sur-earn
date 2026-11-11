/**
 * Ad Network Integration Configurations
 * Supports:
 *  - Monetag (Rewarded Interstitial / In-Page Push / OnClick)
 *  - Google AdSense H5 Games Ads (Rewarded Ad SDK)
 *  - Direct Sponsor Video Fallback
 */

export type SupportedAdNetwork = "sample" | "monetag" | "adsense" | "adsterra";

export interface AdNetworkConfig {
  network: SupportedAdNetwork;
  monetagZoneId?: string;
  adsenseClientId?: string;
  adsterraKey?: string;
  enabledForGames: boolean;
  rewardCoinsPerAd: number;
}

export const AD_CONFIG: AdNetworkConfig = {
  network: (process.env.NEXT_PUBLIC_AD_NETWORK as SupportedAdNetwork) || "sample",
  monetagZoneId: process.env.NEXT_PUBLIC_MONETAG_ZONE_ID || "",
  adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",
  adsterraKey: process.env.NEXT_PUBLIC_ADSTERRA_KEY || "",
  enabledForGames: process.env.NEXT_PUBLIC_GATE_GAMES_WITH_ADS !== "false",
  rewardCoinsPerAd: 50,
};

// Global typing for browser window ad SDKs
declare global {
  interface Window {
    show_8928421?: () => Promise<void>; // Monetag example zone function
    adsbygoogle?: any[];
    adBreak?: (options: any) => void;
    adConfig?: (options: any) => void;
  }
}
