export type SubscriptionStatus = "trial" | "active" | "paused" | "cancelled";
export type CurrencyCode = "THB" | "USD" | "EUR" | "JPY";
export type BillingCycle = "monthly" | "yearly";

export interface PaymentMethod {
  id: string;
  provider_name: string; // e.g. Visa, Mastercard, TrueMoney, PayPal
  last_four_digits: string;
}

export interface SubscriptionItem {
  id: string;
  service_name: string;
  category: "AI & Productivity" | "Entertainment" | "Cloud & Design" | "Utilities";
  price: number;
  currency: CurrencyCode;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  next_billing_date: string; // YYYY-MM-DD
  payment_method_id?: string;
  alert_enabled: boolean;
  cancel_url?: string;
}

export interface AlertLogItem {
  id: string;
  subscription_name: string;
  type: "trial_warning" | "upcoming_renewal" | "test";
  channel: "LINE Notify" | "Email" | "LINE & Email";
  message: string;
  sent_at: string;
}

export interface AlertSettings {
  lineNotifyConnected: boolean;
  lineNotifyToken: string;
  emailConnected: boolean;
  emailAddress: string;
  notifyDaysBefore: number; // 1, 3, 5, 7
  dailyCronTime: string; // e.g. "09:00"
  urgentTrial24hAlert: boolean;
  usdToThbRate: number;
}

