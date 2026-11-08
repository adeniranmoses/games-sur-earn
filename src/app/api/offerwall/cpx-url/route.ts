/**
 * GET /api/offerwall/cpx-url
 *
 * Returns a signed CPX Research survey wall URL for the authenticated user.
 * Keeps app configuration server-side and links the user's ID for postbacks.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const appId = process.env.CPX_APP_ID || process.env.CPX_APP_KEY || "cpx_partner_preview";
  
  // CPX Research URL format:
  // https://offers.cpx-research.com/index.php?app_id={app_id}&ext_user_id={user_id}
  const url = `https://offers.cpx-research.com/index.php?app_id=${encodeURIComponent(
    appId
  )}&ext_user_id=${encodeURIComponent(userId)}`;

  return NextResponse.json({ url });
}
