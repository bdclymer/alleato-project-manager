import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { error_message, stack_trace, component_stack, page_url, user_agent } = body;

    if (!error_message) {
      return NextResponse.json({ error: "error_message is required" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from("error_log").insert({
      error_message: String(error_message).substring(0, 2000),
      stack_trace: String(stack_trace || "").substring(0, 5000),
      component_stack: String(component_stack || "").substring(0, 5000),
      page_url: String(page_url || "").substring(0, 500),
      user_agent: String(user_agent || "").substring(0, 500),
      fixed: false,
    });

    if (error) {
      console.error("Failed to log error to Supabase:", error.message);
      // Return success anyway - error logging should not block the client
      return NextResponse.json({ success: true, logged: false });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error logging endpoint failed:", err);
    // Return success anyway - error logging should not block the client
    return NextResponse.json({ success: true, logged: false });
  }
}

export async function GET() {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("error_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(100);

    if (error) {
      // Table may not exist yet - return empty array gracefully
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
