import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel, token, message } = body;

    if (
      channel === "LINE Notify" &&
      token &&
      !token.includes("••••") &&
      token.trim().length > 10
    ) {
      // Send real request to LINE Notify API if a real token was provided
      const params = new URLSearchParams();
      params.append("message", message || "แจ้งเตือนจาก Digital Expense Tracker");

      const response = await fetch("https://notify-api.line.me/api/notify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `LINE Notify ตอบกลับด้วยสถานะ ${response.status}`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        mode: "live",
        message: "ส่งแจ้งเตือนเข้า LINE Notify จริงสำเร็จแล้ว",
      });
    }

    // Simulated response for Demo / masked token
    return NextResponse.json({
      ok: true,
      mode: "simulated",
      message: `ส่งแจ้งเตือนผ่าน ${channel} สำเร็จ (Demo Mode)`,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

