import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const expected = process.env.SYSTEM_DASHBOARD_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: "SYSTEM_DASHBOARD_PASSWORD not configured" },
        { status: 500 }
      );
    }

    if (password === expected) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
