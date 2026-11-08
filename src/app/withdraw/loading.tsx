import BrandLoader from "@/components/BrandLoader";

export default function WithdrawLoading() {
  return (
    <BrandLoader
      message="Loading Rewards Shop..."
      submessage="Fetching gift cards, payout options & balance..."
      fullPage={true}
    />
  );
}
