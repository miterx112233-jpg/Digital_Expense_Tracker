/**
 * Digital Expense Tracker — Background Alert Worker (Cron Service)
 * Checks upcoming billing dates (3-5 days prior) and sends LINE Notify alerts.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN || "";
const ALERT_DAYS_BEFORE = Number(process.env.ALERT_DAYS_BEFORE || 3);
const USD_TO_THB = Number(process.env.USD_TO_THB_RATE || 34.0);

async function sendLineNotify(message) {
  if (!LINE_NOTIFY_TOKEN) {
    console.log("[Worker Dry-Run] LINE Notify Message:", message);
    return;
  }
  const params = new URLSearchParams({ message });
  const res = await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LINE_NOTIFY_TOKEN}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  console.log("[Worker] LINE Notify status:", res.status);
}

async function checkUpcomingRenewals() {
  console.log(
    `[${new Date().toISOString()}] Running Daily Subscription Alert Check (Alert window: ${ALERT_DAYS_BEFORE} days)...`
  );

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log(
      "[Worker] Supabase credentials not configured. Skipping remote DB query."
    );
    return;
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?status=in.(active,trial)&alert_enabled=eq.true&select=*`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    console.error("[Worker] Failed to fetch subscriptions:", res.statusText);
    return;
  }

  const subscriptions = await res.json();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const sub of subscriptions) {
    const target = new Date(sub.next_billing_date + "T00:00:00");
    const daysLeft = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft >= 0 && daysLeft <= ALERT_DAYS_BEFORE) {
      const thb =
        sub.currency === "USD"
          ? Math.round(Number(sub.price) * USD_TO_THB)
          : Number(sub.price);
      const prefix =
        sub.status === "trial" ? "⚠️ [Free Trial ใกล้หมด]" : "🔔 [แจ้งเตือนรอบบิล]";
      const msg = `\n${prefix} ${sub.service_name}\nเหลือเวลาอีก: ${daysLeft} วัน (${sub.next_billing_date})\nยอดตัดชำระ: ฿${thb.toLocaleString()} THB`;
      await sendLineNotify(msg);
    }
  }
}

checkUpcomingRenewals();

