import BrandLoader from "@/components/BrandLoader";

export default function Loading() {
  return (
    <BrandLoader
      message="Loading RewardPlatform..."
      submessage="Syncing your balance & rewards..."
      fullPage={true}
    />
  );
}
