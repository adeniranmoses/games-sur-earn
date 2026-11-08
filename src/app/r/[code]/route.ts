import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const url = new URL(`/register?ref=${encodeURIComponent(code || "")}`, request.url);
  return NextResponse.redirect(url);
}
