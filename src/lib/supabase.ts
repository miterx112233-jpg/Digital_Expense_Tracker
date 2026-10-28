import { createClient } from "@supabase/supabase-js";
import {
  AlertLogItem,
  AlertSettings,
  PaymentMethod,
  SubscriptionItem,
} from "@/types/expense";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm-1", provider_name: "Visa", last_four_digits: "4210" },
  { id: "pm-2", provider_name: "Mastercard", last_four_digits: "8891" },
  { id: "pm-3", provider_name: "TrueMoney", last_four_digits: "0942" },
  { id: "pm-4", provider_name: "PayPal", last_four_digits: "" },
];

export const DEFAULT_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: "sub-figma",
    service_name: "Figma Professional",
    category: "Cloud & Design",
    price: 15,
    currency: "USD",
    billing_cycle: "monthly",
    status: "trial",
    next_billing_date: "2026-10-30",
    payment_method_id: "pm-1",
    alert_enabled: true,
    cancel_url: "https://www.figma.com/settings",
  },
  {
    id: "sub-chatgpt",
    service_name: "ChatGPT Plus",
    category: "AI & Productivity",
    price: 20,
    currency: "USD",
    billing_cycle: "monthly",
    status: "active",
    next_billing_date: "2026-10-31",
    payment_method_id: "pm-1",
    alert_enabled: true,
    cancel_url: "https://chatgpt.com/#settings/Subscription",
  },
  {
    id: "sub-claude",
    service_name: "Claude Pro Trial",
    category: "AI & Productivity",
    price: 20,
    currency: "USD",
    billing_cycle: "monthly",
    status: "trial",
    next_billing_date: "2026-11-02",
    payment_method_id: "pm-2",
    alert_enabled: true,
    cancel_url: "https://claude.ai/settings/billing",
  },
  {
    id: "sub-netflix",
    service_name: "Netflix Standard",
    category: "Entertainment",
    price: 349,
    currency: "THB",
    billing_cycle: "monthly",
    status: "active",
    next_billing_date: "2026-11-12",
    payment_method_id: "pm-3",
    alert_enabled: true,
    cancel_url: "https://www.netflix.com/youraccount",
  },
  {
    id: "sub-spotify",
    service_name: "Spotify Premium",
    category: "Entertainment",
    price: 209,
    currency: "THB",
    billing_cycle: "monthly",
    status: "active",
    next_billing_date: "2026-11-18",
    payment_method_id: "pm-3",
    alert_enabled: true,
    cancel_url: "https://www.spotify.com/account/subscription/",
  },
  {
    id: "sub-icloud",
    service_name: "iCloud+ 200GB",
    category: "Cloud & Design",
    price: 99,
    currency: "THB",
    billing_cycle: "monthly",
    status: "active",
    next_billing_date: "2026-11-24",
    payment_method_id: "pm-2",
    alert_enabled: false,
    cancel_url: "https://support.apple.com/en-us/HT202039",
  },
  {
    id: "sub-adobe",
    service_name: "Adobe Creative Cloud",
    category: "Cloud & Design",
    price: 599,
    currency: "THB",
    billing_cycle: "monthly",
    status: "paused",
    next_billing_date: "2026-11-28",
    payment_method_id: "pm-1",
    alert_enabled: false,
    cancel_url: "https://account.adobe.com/plans",
  },
];

export const DEFAULT_ALERT_LOGS: AlertLogItem[] = [
  {
    id: "log-1",
    subscription_name: "Figma Professional",
    type: "trial_warning",
    channel: "LINE & Email",
    message:
      "แจ้งเตือน Free Trial: Figma Professional จะหมดทดลองใช้ในอีก 2 วัน (ยอดตัดบัตร $15.00 ≈ ฿510)",
    sent_at: "วันนี้ • 09:00 น.",
  },
  {
    id: "log-2",
    subscription_name: "ChatGPT Plus",
    type: "upcoming_renewal",
    channel: "LINE Notify",
    message:
      "แจ้งเตือนล่วงหน้า 3 วัน: ChatGPT Plus ($20.00 ≈ ฿680) จะตัดรอบบิลวันที่ 31 ต.ค. 2026",
    sent_at: "今天 • 09:00 น.".replace("今天", "เมื่อวาน"),
  },
  {
    id: "log-3",
    subscription_name: "Netflix Standard",
    type: "upcoming_renewal",
    channel: "Email",
    message: "สรุปรอบบิลรายเดือน: Netflix Standard (฿349) ตัดบัตรสำเร็จ",
    sent_at: "12 ต.ค. 2026 • 09:00 น.",
  },
];

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  lineNotifyConnected: true,
  lineNotifyToken: "••••••••••••••••9A4F",
  emailConnected: true,
  emailAddress: "user@digitaltracker.app",
  notifyDaysBefore: 3,
  dailyCronTime: "09:00",
  urgentTrial24hAlert: true,
  usdToThbRate: 34.0,
};

