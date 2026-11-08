import BrandLoader from "@/components/BrandLoader";

export default function EarnLoading() {
  return (
    <BrandLoader
      message="Loading Earn Hub..."
      submessage="Fetching available surveys, games & video ads..."
      fullPage={true}
    />
  );
}
