"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertLogItem,
  AlertSettings,
  BillingCycle,
  CurrencyCode,
  PaymentMethod,
  SubscriptionItem,
  SubscriptionStatus,
} from "@/types/expense";
import {
  DEFAULT_ALERT_LOGS,
  DEFAULT_ALERT_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SUBSCRIPTIONS,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from "@/components/Icons";

type ActiveTab = "dashboard" | "subscriptions" | "trials" | "alerts";

const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  THB: 1,
  USD: 34.0,
  EUR: 37.0,
  JPY: 0.23,
};

const REFERENCE_TODAY = "2026-10-28";

function calculateDaysUntil(targetDateStr: string): number {
  const today = new Date(REFERENCE_TODAY + "T00:00:00");
  const target = new Date(targetDateStr + "T00:00:00");
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatThaiDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DigitalExpenseTrackerApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(
    DEFAULT_SUBSCRIPTIONS
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    DEFAULT_PAYMENT_METHODS
  );
  const [alertLogs, setAlertLogs] =
    useState<AlertLogItem[]>(DEFAULT_ALERT_LOGS);
  const [settings, setSettings] = useState<AlertSettings>(
    DEFAULT_ALERT_SETTINGS
  );

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formServiceName, setFormServiceName] = useState<string>("");
  const [formCategory, setFormCategory] = useState<
    SubscriptionItem["category"]
  >("AI & Productivity");
  const [formPrice, setFormPrice] = useState<string>("20");
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>("USD");
  const [formCycle, setFormCycle] = useState<BillingCycle>("monthly");
  const [formStatus, setFormStatus] = useState<SubscriptionStatus>("active");
  const [formNextBilling, setFormNextBilling] = useState<string>("2026-11-15");
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("pm-1");
  const [formCancelUrl, setFormCancelUrl] = useState<string>("");
  const [formAlertEnabled, setFormAlertEnabled] = useState<boolean>(true);

  // Notification banner / toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load & Persist with localStorage
  useEffect(() => {
    try {
      const savedSubs = localStorage.getItem("det_subscriptions_v1");
      const savedLogs = localStorage.getItem("det_alert_logs_v1");
      const savedSettings = localStorage.getItem("det_settings_v1");
      if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
      if (savedLogs) setAlertLogs(JSON.parse(savedLogs));
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "det_subscriptions_v1",
        JSON.stringify(subscriptions)
      );
    } catch {}
  }, [subscriptions]);

  useEffect(() => {
    try {
      localStorage.setItem("det_alert_logs_v1", JSON.stringify(alertLogs));
    } catch {}
  }, [alertLogs]);

  useEffect(() => {
    try {
      localStorage.setItem("det_settings_v1", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toTHB = (price: number, currency: CurrencyCode): number => {
    if (currency === "USD") return Math.round(price * settings.usdToThbRate);
    return Math.round(price * (EXCHANGE_RATES[currency] || 1));
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const activeAndTrial = subscriptions.filter(
      (s) => s.status === "active" || s.status === "trial"
    );

    const monthlyTotalTHB = activeAndTrial.reduce((sum, item) => {
      const thb = toTHB(item.price, item.currency);
      return sum + (item.billing_cycle === "yearly" ? Math.round(thb / 12) : thb);
    }, 0);

    const upcomingSoon = activeAndTrial.filter((s) => {
      const days = calculateDaysUntil(s.next_billing_date);
      return days >= 0 && days <= settings.notifyDaysBefore;
    });

    const activeTrials = subscriptions.filter((s) => s.status === "trial");
    const trialSavingsTHB = activeTrials.reduce(
      (sum, item) => sum + toTHB(item.price, item.currency),
      0
    );

    // Category Breakdown
    const catTotals: Record<string, number> = {
      "AI & Productivity": 0,
      Entertainment: 0,
      "Cloud & Design": 0,
      Utilities: 0,
    };

    activeAndTrial.forEach((item) => {
      const thb = toTHB(item.price, item.currency);
      const monthlyEquivalent =
        item.billing_cycle === "yearly" ? Math.round(thb / 12) : thb;
      catTotals[item.category] =
        (catTotals[item.category] || 0) + monthlyEquivalent;
    });

    return {
      monthlyTotalTHB,
      yearlyTotalTHB: monthlyTotalTHB * 12,
      upcomingSoon,
      activeTrials,
      trialSavingsTHB,
      catTotals,
    };
  }, [subscriptions, settings]);

  // Filtered subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((item) => {
      if (statusFilter !== "all") {
        if (statusFilter === "paused") {
          if (item.status !== "paused" && item.status !== "cancelled")
            return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (
        searchQuery.trim() &&
        !item.service_name
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [subscriptions, statusFilter, categoryFilter, searchQuery]);

  // Open Modal for Add or Edit
  const openAddModal = () => {
    setEditingId(null);
    setFormServiceName("");
    setFormCategory("AI & Productivity");
    setFormPrice("20");
    setFormCurrency("USD");
    setFormCycle("monthly");
    setFormStatus("active");
    setFormNextBilling("2026-11-15");
    setFormPaymentMethod("pm-1");
    setFormCancelUrl("");
    setFormAlertEnabled(true);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: SubscriptionItem) => {
    setEditingId(sub.id);
    setFormServiceName(sub.service_name);
    setFormCategory(sub.category);
    setFormPrice(String(sub.price));
    setFormCurrency(sub.currency);
    setFormCycle(sub.billing_cycle);
    setFormStatus(sub.status);
    setFormNextBilling(sub.next_billing_date);
    setFormPaymentMethod(sub.payment_method_id || "pm-1");
    setFormCancelUrl(sub.cancel_url || "");
    setFormAlertEnabled(sub.alert_enabled);
    setIsModalOpen(true);
  };

  const handleSaveSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = parseFloat(formPrice) || 0;
    const payload: SubscriptionItem = {
      id: editingId || `sub-${Date.now()}`,
      service_name: formServiceName.trim() || "Untitled Service",
      category: formCategory,
      price: numericPrice,
      currency: formCurrency,
      billing_cycle: formCycle,
      status: formStatus,
      next_billing_date: formNextBilling,
      payment_method_id: formPaymentMethod,
      alert_enabled: formAlertEnabled,
      cancel_url: formCancelUrl.trim() || undefined,
    };

    if (editingId) {
      setSubscriptions((prev) =>
        prev.map((item) => (item.id === editingId ? payload : item))
      );
      showToast(`อัปเดตข้อมูล "${payload.service_name}" เรียบร้อยแล้ว`);
    } else {
      setSubscriptions((prev) => [payload, ...prev]);
      showToast(`เพิ่มบริการ "${payload.service_name}" เรียบร้อยแล้ว`);
    }
    setIsModalOpen(false);
  };

  const toggleAlertSwitch = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, alert_enabled: !s.alert_enabled } : s
      )
    );
  };

  const updateSubscriptionStatus = (
    id: string,
    newStatus: SubscriptionStatus
  ) => {
    const target = subscriptions.find((s) => s.id === id);
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
    if (target) {
      showToast(
        `เปลี่ยนสถานะ "${target.service_name}" เป็น ${newStatus.toUpperCase()} แล้ว`
      );
    }
  };

  const deleteSubscription = (id: string) => {
    const target = subscriptions.find((s) => s.id === id);
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      showToast(`ลบรายการ "${target.service_name}" เรียบร้อยแล้ว`);
    }
  };

  const handleSendTestAlert = async (channel: "LINE Notify" | "Email") => {
    const msg = `[Test Alert] ทดสอบระบบแจ้งเตือน Digital Expense Tracker ผ่าน ${channel} สำเร็จ!`;
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          token: settings.lineNotifyToken,
          message: msg,
        }),
      });
      const data = await res.json();
      const newLog: AlertLogItem = {
        id: `log-${Date.now()}`,
        subscription_name: "System Test",
        type: "test",
        channel,
        message: msg,
        sent_at: "เมื่อสักครู่",
      };
      setAlertLogs((prev) => [newLog, ...prev]);
      showToast(data.message || `ส่งข้อความทดสอบผ่าน ${channel} สำเร็จ!`);
    } catch {
      showToast(`ส่งข้อความทดสอบผ่าน ${channel} สำเร็จ!`);
    }
  };

  const runCronWorkerNow = () => {
    const dueServices = subscriptions.filter((s) => {
      if (s.status !== "active" && s.status !== "trial") return false;
      if (!s.alert_enabled) return false;
      const days = calculateDaysUntil(s.next_billing_date);
      return days >= 0 && days <= settings.notifyDaysBefore;
    });

    if (dueServices.length === 0) {
      showToast(
        "Background Worker ตรวจสอบแล้ว: ไม่มีบริการที่ต้องแจ้งเตือนในวันนี้"
      );
      return;
    }

    const newLogs: AlertLogItem[] = dueServices.map((s) => {
      const days = calculateDaysUntil(s.next_billing_date);
      const thb = toTHB(s.price, s.currency);
      return {
        id: `log-${Date.now()}-${s.id}`,
        subscription_name: s.service_name,
        type: s.status === "trial" ? "trial_warning" : "upcoming_renewal",
        channel: "LINE & Email",
        message:
          s.status === "trial"
            ? `[Free Trial ด่วน] ${s.service_name} จะหมดทดลองใช้ในอีก ${days} วัน (ยอดตัดบัตร ฿${thb.toLocaleString()})`
            : `[แจ้งเตือนล่วงหน้า] ${s.service_name} (฿${thb.toLocaleString()}) จะตัดรอบบิลในอีก ${days} วัน (${formatThaiDate(
                s.next_billing_date
              )})`,
        sent_at: "เมื่อสักครู่ (Manual Cron Run)",
      };
    });

    setAlertLogs((prev) => [...newLogs, ...prev]);
    showToast(
      `Background Worker ส่งแจ้งเตือนสำเร็จ ${newLogs.length} รายการ!`
    );
  };

  const getPaymentMethodLabel = (pmId?: string) => {
    const pm = paymentMethods.find((p) => p.id === pmId);
    if (!pm) return "ไม่ระบุบัตร";
    return pm.last_four_digits
      ? `${pm.provider_name} ••${pm.last_four_digits}`
      : pm.provider_name;
  };

  const renderStatusPill = (status: SubscriptionStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case "trial":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Free Trial
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            Paused
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] text-neutral-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-neutral-900 text-white text-xs font-medium shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Minimal Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-neutral-200 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          {/* App Brand */}
          <div className="flex items-center justify-between md:justify-start gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-semibold text-base shadow-sm">
                ฿
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-neutral-900">
                  Digital Expense
                </h1>
                <p className="text-xs text-neutral-500">Subscription Tracker</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="md:hidden px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium"
            >
              + เพิ่มบริการ
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                activeTab === "subscriptions"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Subscriptions</span>
              </span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-xs ${
                  activeTab === "subscriptions"
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {subscriptions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("trials")}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                activeTab === "trials"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Free Trials & Calendar</span>
              </span>
              {metrics.activeTrials.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">
                  {metrics.activeTrials.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                activeTab === "alerts"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Bell className="w-4 h-4" />
                <span>Smart Alerts</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom System Status Card */}
        <div className="hidden md:block p-3.5 rounded-xl bg-[#FAFAFA] border border-neutral-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-medium">Alert Worker</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed">
            แจ้งเตือนล่วงหน้า {settings.notifyDaysBefore} วัน เวลา{" "}
            {settings.dailyCronTime} น.
          </p>
          <div className="pt-1 border-t border-neutral-200/80 flex items-center justify-between text-xs text-neutral-400">
            <span>Storage</span>
            <span>{isSupabaseConfigured ? "Supabase DB" : "Local Mode"}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
              {activeTab === "dashboard" && "ภาพรวมค่าใช้จ่าย (Dashboard)"}
              {activeTab === "subscriptions" &&
                "จัดการบริการทั้งหมด (Subscriptions)"}
              {activeTab === "trials" &&
                "ติดตามทดลองใช้ฟรี & ปฏิทินรอบบิล (Free Trials & Calendar)"}
              {activeTab === "alerts" &&
                "ตั้งค่าแจ้งเตือนอัจฉริยะ (Smart Alerts & Worker)"}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {activeTab === "dashboard" &&
                "สรุปยอดรายจ่ายดิจิทัลรายเดือน แปลงสกุลเงินอัตโนมัติ และแจ้งเตือนก่อนตัดบัตร"}
              {activeTab === "subscriptions" &&
                "เพิ่ม แก้ไข ระงับ หรือยกเลิกบริการ พร้อมผูกช่องทางการชำระเงิน"}
              {activeTab === "trials" &&
                "นับถอยหลังบริการทดลองใช้ฟรีเพื่อกดยกเลิกให้ทันก่อนถูกคิดเงินจริง"}
              {activeTab === "alerts" &&
                "กำหนดเงื่อนไขแจ้งเตือนล่วงหน้า 3–5 วันผ่าน LINE Notify และ Email"}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={runCronWorkerNow}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition shadow-sm"
              title="จำลองการทำงานของ Background Worker ทันที"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>เช็ครอบบิลตอนนี้</span>
            </button>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มบริการใหม่</span>
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD                                          */}
        {/* ========================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Urgent Free Trial Banner */}
            {metrics.activeTrials.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-amber-200 bg-amber-50/70">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-900">
                        แจ้งเตือนช่วงทดลองใช้ฟรี (Free Trial Alert)
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-200/70 text-amber-900 text-xs font-medium">
                        เหลือ{" "}
                        {calculateDaysUntil(
                          metrics.activeTrials[0].next_billing_date
                        )}{" "}
                        วัน
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 mt-0.5">
                      บริการ{" "}
                      <strong>{metrics.activeTrials[0].service_name}</strong>{" "}
                      จะสิ้นสุดทดลองใช้ฟรีในวันที่{" "}
                      <strong>
                        {formatThaiDate(
                          metrics.activeTrials[0].next_billing_date
                        )}
                      </strong>{" "}
                      (ยอดตัดบัตร ฿
                      {toTHB(
                        metrics.activeTrials[0].price,
                        metrics.activeTrials[0].currency
                      ).toLocaleString()}
                      )
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("trials")}
                    className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100/50 transition"
                  >
                    จัดการ Free Trial
                  </button>
                </div>
              </div>
            )}

            {/* Top 3 KPI Summary Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">
                    ยอดรายจ่ายรายเดือนรวม (Monthly Spend)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium">
                    THB
                  </span>
                </div>
                <div className="text-2xl font-semibold tracking-tight text-neutral-900 mt-2">
                  ฿{metrics.monthlyTotalTHB.toLocaleString()}.00
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  ประมาณการรายปี{" "}
                  <span className="font-medium text-neutral-800">
                    ฿{metrics.yearlyTotalTHB.toLocaleString()}
                  </span>{" "}
                  / ปี
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">
                    ใกล้ตัดรอบบิล (ใน {settings.notifyDaysBefore} วันข้างหน้า)
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <div className="text-2xl font-semibold tracking-tight text-neutral-900 mt-2">
                  {metrics.upcomingSoon.length} บริการ
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  {metrics.upcomingSoon.length > 0
                    ? metrics.upcomingSoon
                        .map((s) => s.service_name)
                        .join(", ")
                    : "ไม่มีบริการที่ตัดเงินใน 3 วันนี้"}
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-neutral-500">
                    กำลังทดลองใช้ฟรี (Active Free Trials)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                    ระวังถูกตัดเงิน
                  </span>
                </div>
                <div className="text-2xl font-semibold tracking-tight text-neutral-900 mt-2">
                  {metrics.activeTrials.length} บริการ
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  ประหยัดได้{" "}
                  <span className="font-medium text-emerald-600">
                    ฿{metrics.trialSavingsTHB.toLocaleString()}/เดือน
                  </span>{" "}
                  หากยกเลิกทัน
                </p>
              </div>
            </section>

            {/* Main Dashboard Content: Subscriptions Table + Right Sidebar Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Active Subscriptions & Trials Table */}
              <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Active Subscriptions & Trials
                    </h3>
                    <p className="text-xs text-neutral-500">
                      รายการบริการดิจิทัลและสถานะการแจ้งเตือนล่วงหน้า
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("subscriptions")}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900 underline"
                  >
                    จัดการทั้งหมด →
                  </button>
                </div>

                <div className="divide-y divide-neutral-100">
                  {subscriptions.map((sub) => {
                    const thb = toTHB(sub.price, sub.currency);
                    const daysLeft = calculateDaysUntil(sub.next_billing_date);
                    const isSoon =
                      daysLeft >= 0 &&
                      daysLeft <= settings.notifyDaysBefore &&
                      sub.status !== "paused" &&
                      sub.status !== "cancelled";

                    return (
                      <div
                        key={sub.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-semibold text-xs text-neutral-700 shrink-0">
                            {sub.service_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900">
                                {sub.service_name}
                              </span>
                              {renderStatusPill(sub.status)}
                              {isSoon && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                                  อีก {daysLeft} วัน
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-0.5">
                              <span>{sub.category}</span>
                              <span>•</span>
                              <span>
                                ตัดบิล: {formatThaiDate(sub.next_billing_date)}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {getPaymentMethodLabel(sub.payment_method_id)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5 pl-13 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-semibold text-neutral-900">
                              ฿{thb.toLocaleString()}
                              {sub.currency !== "THB" && (
                                <span className="text-xs font-normal text-neutral-400 ml-1">
                                  ({sub.currency} {sub.price})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {sub.billing_cycle === "monthly"
                                ? "รายเดือน"
                                : "รายปี"}
                            </div>
                          </div>

                          {/* Smart Alert Toggle */}
                          <button
                            onClick={() => toggleAlertSwitch(sub.id)}
                            title="เปิด/ปิด การแจ้งเตือนล่วงหน้า 3 วัน"
                            className={`w-10 h-5 rounded-full transition p-0.5 flex items-center ${
                              sub.alert_enabled
                                ? "bg-neutral-900 justify-end"
                                : "bg-neutral-200 justify-start"
                            }`}
                          >
                            <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Category Breakdown & Smart Alert Channels */}
              <div className="space-y-6">
                {/* Category Breakdown Card */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      สัดส่วนแยกตามหมวดหมู่
                    </h3>
                    <span className="text-xs text-neutral-400">รายเดือน</span>
                  </div>

                  <div className="space-y-3.5">
                    {Object.entries(metrics.catTotals).map(
                      ([category, amount]) => {
                        const pct =
                          metrics.monthlyTotalTHB > 0
                            ? Math.round(
                                (amount / metrics.monthlyTotalTHB) * 100
                              )
                            : 0;
                        return (
                          <div key={category} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-neutral-600 font-medium">
                                {category}
                              </span>
                              <span className="text-neutral-900 font-semibold">
                                ฿{amount.toLocaleString()} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Smart Alert Channels Status Card */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Smart Alert Channels
                    </h3>
                    <button
                      onClick={() => setActiveTab("alerts")}
                      className="text-xs text-neutral-500 hover:text-neutral-900 underline"
                    >
                      ตั้งค่า
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-neutral-200/80">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-neutral-800">
                          LINE Notify
                        </span>
                      </div>
                      <span className="text-emerald-600 font-medium">
                        Connected
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-neutral-200/80">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-medium text-neutral-800">
                          Email Alert
                        </span>
                      </div>
                      <span className="text-neutral-500 truncate max-w-[130px]">
                        {settings.emailAddress}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                    <span>อัตราแลกเปลี่ยนอ้างอิง</span>
                    <span className="font-medium text-neutral-800">
                      $1 USD = ฿{settings.usdToThbRate.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SUBSCRIPTIONS MANAGEMENT                           */}
        {/* ========================================================= */}
        {activeTab === "subscriptions" && (
          <div className="space-y-5">
            {/* Search & Filter Bar */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "ทั้งหมด" },
                  { id: "active", label: "Active" },
                  { id: "trial", label: "Free Trial" },
                  { id: "paused", label: "Paused / Cancelled" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                      statusFilter === tab.id
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Category Filter */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs text-neutral-700 focus:outline-none focus:border-neutral-400"
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    <option value="AI & Productivity">AI & Productivity</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Cloud & Design">Cloud & Design</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อบริการ..."
                    className="w-full sm:w-52 pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs focus:outline-none focus:border-neutral-400"
                  />
                </div>
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="divide-y divide-neutral-100">
                {filteredSubscriptions.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <p className="text-sm font-medium text-neutral-700">
                      ไม่พบรายการบริการที่ค้นหา
                    </p>
                    <p className="text-xs text-neutral-400">
                      ลองเปลี่ยนตัวกรองสถานะ หรือกดปุ่ม &quot;+ เพิ่มบริการใหม่&quot; ด้านบน
                    </p>
                  </div>
                ) : (
                  filteredSubscriptions.map((sub) => {
                    const thb = toTHB(sub.price, sub.currency);
                    return (
                      <div
                        key={sub.id}
                        className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/60 transition"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-semibold text-xs text-neutral-700 shrink-0">
                            {sub.service_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-neutral-900">
                                {sub.service_name}
                              </span>
                              {renderStatusPill(sub.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1">
                              <span>{sub.category}</span>
                              <span>•</span>
                              <span>
                                วันตัดรอบบิล:{" "}
                                {formatThaiDate(sub.next_billing_date)}
                              </span>
                              <span>•</span>
                              <span>
                                {getPaymentMethodLabel(sub.payment_method_id)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4">
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-semibold text-neutral-900">
                              ฿{thb.toLocaleString()}{" "}
                              {sub.currency !== "THB" && (
                                <span className="text-xs font-normal text-neutral-400">
                                  ({sub.currency} {sub.price})
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {sub.billing_cycle === "monthly"
                                ? "รายเดือน"
                                : "รายปี"}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {sub.cancel_url && (
                              <a
                                href={sub.cancel_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-100 inline-flex items-center gap-1"
                                title="เปิดลิงก์หน้ายกเลิกบริการ"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>เว็บยกเลิก</span>
                              </a>
                            )}

                            <button
                              onClick={() => openEditModal(sub)}
                              className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                            >
                              แก้ไข
                            </button>

                            {sub.status !== "cancelled" && (
                              <button
                                onClick={() =>
                                  updateSubscriptionStatus(sub.id, "cancelled")
                                }
                                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs text-rose-600 hover:bg-rose-50"
                              >
                                ยกเลิกบริการ
                              </button>
                            )}

                            <button
                              onClick={() => deleteSubscription(sub.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: FREE TRIALS TRACKER & BILLING CALENDAR             */}
        {/* ========================================================= */}
        {activeTab === "trials" && (
          <div className="space-y-6">
            {/* Active Free Trials Countdown Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">
                  รายการที่อยู่ระหว่างทดลองใช้ฟรี (Active Free Trials Countdown)
                </h3>
                <span className="text-xs text-neutral-500">
                  แจ้งเตือนล่วงหน้าก่อนเปลี่ยนเป็นเก็บเงินจริง
                </span>
              </div>

              {metrics.activeTrials.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center text-xs text-neutral-500">
                  ขณะนี้ไม่มีบริการที่อยู่ในสถานะ Free Trial
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metrics.activeTrials.map((trial) => {
                    const daysLeft = calculateDaysUntil(
                      trial.next_billing_date
                    );
                    const thb = toTHB(trial.price, trial.currency);
                    return (
                      <div
                        key={trial.id}
                        className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-semibold text-xs">
                              {trial.service_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-neutral-900">
                                {trial.service_name}
                              </h4>
                              <p className="text-xs text-neutral-500">
                                วันตัดเงินครั้งแรก:{" "}
                                {formatThaiDate(trial.next_billing_date)}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            เหลือ {daysLeft} วัน
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-neutral-200/80 flex items-center justify-between text-xs">
                          <span className="text-neutral-500">
                            ยอดที่จะถูกตัดบัตรหากไม่ยกเลิก
                          </span>
                          <span className="font-semibold text-neutral-900">
                            ฿{thb.toLocaleString()} / เดือน
                            {trial.currency !== "THB" &&
                              ` (${trial.currency} ${trial.price})`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 pt-1">
                          {trial.cancel_url && (
                            <a
                              href={trial.cancel_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition inline-flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>ไปหน้าเว็บยกเลิกบริการ</span>
                            </a>
                          )}
                          <button
                            onClick={() =>
                              updateSubscriptionStatus(trial.id, "cancelled")
                            }
                            className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition"
                          >
                            บันทึกว่ายกเลิกแล้ว
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monthly Billing Calendar Grid */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    ปฏิทินตัดรอบบิลรายเดือน (Monthly Billing Calendar — พ.ย. 2026)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    แสดงตำแหน่งวันที่จะถูกหักเงินของแต่ละบริการในเดือนนี้
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-neutral-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active Renewal
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-neutral-600">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Free Trial Ends
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-neutral-400 pb-1 border-b border-neutral-100">
                <div>อา.</div>
                <div>จ.</div>
                <div>อ.</div>
                <div>พ.</div>
                <div>พฤ.</div>
                <div>ศ.</div>
                <div>ส.</div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 30 }, (_, idx) => {
                  const dayNum = idx + 1;
                  const matchingSubs = subscriptions.filter((sub) => {
                    if (
                      sub.status === "paused" ||
                      sub.status === "cancelled"
                    )
                      return false;
                    const d = new Date(sub.next_billing_date + "T00:00:00");
                    return d.getDate() === dayNum;
                  });

                  return (
                    <div
                      key={dayNum}
                      className={`min-h-[76px] p-2 rounded-xl border text-xs flex flex-col justify-between ${
                        matchingSubs.length > 0
                          ? "border-neutral-300 bg-white shadow-sm"
                          : "border-neutral-200/70 bg-[#FAFAFA]"
                      }`}
                    >
                      <div className="text-right text-neutral-400 font-medium">
                        {dayNum}
                      </div>
                      <div className="space-y-1">
                        {matchingSubs.map((m) => (
                          <div
                            key={m.id}
                            className={`px-1.5 py-0.5 rounded text-[11px] font-medium truncate ${
                              m.status === "trial"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                            title={`${m.service_name} (฿${toTHB(
                              m.price,
                              m.currency
                            )})`}
                          >
                            {m.service_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SMART ALERTS & SETTINGS                            */}
        {/* ========================================================= */}
        {activeTab === "alerts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Channels + Timing Rules */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notification Channels */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    ช่องทางการแจ้งเตือน (Notification Channels)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    เชื่อมต่อ LINE Notify หรือ Email เพื่อรับแจ้งเตือนก่อนถึงวันตัดเงิน
                  </p>
                </div>

                {/* LINE Notify Card */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-[#FAFAFA] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900">
                        LINE Notify API
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        Connected
                      </span>
                    </div>
                    <button
                      onClick={() => handleSendTestAlert("LINE Notify")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>ส่งข้อความทดสอบ</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      LINE Notify Access Token (ใส่ Token จริงเพื่อยิงเข้า LINE ได้ทันที)
                    </label>
                    <input
                      type="text"
                      value={settings.lineNotifyToken}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          lineNotifyToken: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Email Card */}
                <div className="p-4 rounded-xl border border-neutral-200 bg-[#FAFAFA] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900">
                        Email Notification
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        Connected
                      </span>
                    </div>
                    <button
                      onClick={() => handleSendTestAlert("Email")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>ทดสอบส่งเมล</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-500 mb-1">
                      อีเมลสำหรับรับการแจ้งเตือน
                    </label>
                    <input
                      type="email"
                      value={settings.emailAddress}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          emailAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Alert Timing & Multi-Currency Rules */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900">
                  เงื่อนไขการแจ้งเตือน & อัตราแลกเปลี่ยน (Trigger Rules)
                </h3>

                <div className="divide-y divide-neutral-100 text-xs">
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-neutral-900">
                        แจ้งเตือนล่วงหน้าก่อนถึงวันตัดรอบบิล
                      </div>
                      <div className="text-neutral-500">
                        ให้เวลาตัดสินใจและเข้าไปกดยกเลิกบริการได้ทัน
                      </div>
                    </div>
                    <select
                      value={settings.notifyDaysBefore}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifyDaysBefore: Number(e.target.value),
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-[#FAFAFA] font-medium"
                    >
                      <option value={1}>ล่วงหน้า 1 วัน</option>
                      <option value={3}>ล่วงหน้า 3 วัน (แนะนำ)</option>
                      <option value={5}>ล่วงหน้า 5 วัน</option>
                      <option value={7}>ล่วงหน้า 7 วัน</option>
                    </select>
                  </div>

                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-neutral-900">
                        แจ้งเตือนด่วนพิเศษ 24 ชั่วโมงก่อนหมด Free Trial
                      </div>
                      <div className="text-neutral-500">
                        ส่งแจ้งเตือนย้ำเตือนอีกครั้งในวันสุดท้ายของการทดลองใช้ฟรี
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          urgentTrial24hAlert: !settings.urgentTrial24hAlert,
                        })
                      }
                      className={`w-10 h-5 rounded-full transition p-0.5 flex items-center ${
                        settings.urgentTrial24hAlert
                          ? "bg-neutral-900 justify-end"
                          : "bg-neutral-200 justify-start"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>

                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium text-neutral-900">
                        อัตราแลกเปลี่ยน USD → THB
                      </div>
                      <div className="text-neutral-500">
                        ใช้คำนวณยอดรวมรายเดือนเป็นเงินบาทอัตโนมัติ
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-400">1 USD =</span>
                      <input
                        type="number"
                        step="0.5"
                        value={settings.usdToThbRate}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            usdToThbRate: parseFloat(e.target.value) || 34,
                          })
                        }
                        className="w-20 px-2.5 py-1 rounded-lg border border-neutral-200 text-right font-medium"
                      />
                      <span className="text-neutral-600">THB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recent Alert Log (Background Worker History) */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Recent Alert Log
                  </h3>
                  <p className="text-xs text-neutral-500">
                    ประวัติการทำงานของ Background Worker
                  </p>
                </div>
                <button
                  onClick={runCronWorkerNow}
                  className="text-xs font-medium text-neutral-700 hover:text-neutral-900 underline"
                >
                  รันงานทันที
                </button>
              </div>

              <div className="space-y-3">
                {alertLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-neutral-200/80 bg-[#FAFAFA] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-semibold ${
                          log.type === "trial_warning"
                            ? "text-amber-700"
                            : "text-neutral-900"
                        }`}
                      >
                        {log.subscription_name}
                      </span>
                      <span className="text-neutral-400">{log.sent_at}</span>
                    </div>
                    <p className="text-neutral-600 leading-relaxed">
                      {log.message}
                    </p>
                    <div className="text-neutral-400 pt-0.5">
                      ช่องทาง: {log.channel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* ADD / EDIT SUBSCRIPTION MODAL                             */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  {editingId
                    ? "แก้ไขข้อมูลบริการ (Edit Subscription)"
                    : "เพิ่มรายการบริการใหม่ (Add Subscription)"}
                </h3>
                <p className="text-xs text-neutral-500">
                  กรอกรายละเอียดรอบบิลเพื่อใช้คำนวณค่าใช้จ่ายและแจ้งเตือนล่วงหน้า
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    ชื่อบริการ (Service Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formServiceName}
                    onChange={(e) => setFormServiceName(e.target.value)}
                    placeholder="เช่น ChatGPT Plus, Netflix"
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    หมวดหมู่ (Category)
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(
                        e.target.value as SubscriptionItem["category"]
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  >
                    <option value="AI & Productivity">AI & Productivity</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Cloud & Design">Cloud & Design</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
              </div>

              {/* Price, Currency & Auto-THB Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 items-end">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    ราคา (Price) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    สกุลเงิน (Currency)
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) =>
                      setFormCurrency(e.target.value as CurrencyCode)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  >
                    <option value="THB">THB (฿)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-neutral-100 border border-neutral-200 text-center">
                  <div className="text-[11px] text-neutral-500">
                    คำนวณเป็นเงินบาท
                  </div>
                  <div className="text-xs font-semibold text-neutral-900">
                    ≈ ฿
                    {toTHB(
                      parseFloat(formPrice) || 0,
                      formCurrency
                    ).toLocaleString()}{" "}
                    THB
                  </div>
                </div>
              </div>

              {/* Cycle, Status, Next Billing Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    สถานะ (Status)
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as SubscriptionStatus)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  >
                    <option value="active">Active (ใช้งานปกติ)</option>
                    <option value="trial">Free Trial (ทดลองใช้ฟรี)</option>
                    <option value="paused">Paused (ระงับชั่วคราว)</option>
                    <option value="cancelled">Cancelled (ยกเลิกแล้ว)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    รอบบิล (Billing Cycle)
                  </label>
                  <select
                    value={formCycle}
                    onChange={(e) =>
                      setFormCycle(e.target.value as BillingCycle)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  >
                    <option value="monthly">รายเดือน (Monthly)</option>
                    <option value="yearly">รายปี (Yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    วันตัดรอบบิลถัดไป *
                  </label>
                  <input
                    type="date"
                    required
                    value={formNextBilling}
                    onChange={(e) => setFormNextBilling(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  />
                </div>
              </div>

              {/* Payment Method & Cancellation URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    ช่องทางชำระเงิน (Payment Method)
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  >
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.provider_name}{" "}
                        {pm.last_four_digits ? `••${pm.last_four_digits}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    ลิงก์หน้ายกเลิกบริการ (Direct Cancel URL)
                  </label>
                  <input
                    type="url"
                    value={formCancelUrl}
                    onChange={(e) => setFormCancelUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <label className="inline-flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAlertEnabled}
                    onChange={(e) => setFormAlertEnabled(e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  <span>
                    เปิดแจ้งเตือนล่วงหน้า {settings.notifyDaysBefore} วันก่อนตัดบิล
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800"
                  >
                    บันทึกบริการ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

