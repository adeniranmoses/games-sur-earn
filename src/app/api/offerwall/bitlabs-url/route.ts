/**
 * GET /api/offerwall/bitlabs-url
 *
 * Returns a signed BitLabs survey wall URL for the authenticated user.
 * This keeps BITLABS_APP_TOKEN server-side only — never exposed to the client.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { bitlabsAdapter } from "@/lib/providers/bitlabs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const url = bitlabsAdapter.generateLaunchUrl(userId);

  return NextResponse.json({ url });
}
