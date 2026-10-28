# 📋 Product Backlog — Digital Expense Tracker

เอกสารรวบรวมรายการงานที่ต้องทำ (To-Do), งานที่กำลังดำเนินการ (In Progress) และงานที่เสร็จสิ้นแล้ว (Done) สำหรับการพัฒนาระบบ **Digital Expense Tracker**

---

## ✅ Phase 1: UI/UX & Project Foundation (เสร็จสิ้นแล้ว)
- [x] **ออกแบบบริบทและโครงสร้างระบบ:** จัดทำเอกสาร `README.md`, `Context.md`, และ `database_schema.md`
- [x] **ออกแบบ UI สไตล์มินิมอล (4 หน้าจอหลัก):** บันทึกภาพต้นแบบไว้ในโฟลเดอร์ `UI/`
  - [x] `01_dashboard.jpg` — หน้าภาพรวมค่าใช้จ่ายและสัดส่วนหมวดหมู่
  - [x] `02_free_trials_and_calendar.jpg` — หน้าติดตาม Free Trial และปฏิทินตัดรอบบิล
  - [x] `03_smart_alerts_settings.jpg` — หน้าตั้งค่าแจ้งเตือน LINE Notify / Email และประวัติ Worker
  - [x] `04_subscriptions_and_modal.jpg` — หน้าจัดการรายการบริการและหน้าต่างเพิ่ม/แก้ไขข้อมูล
- [x] **ขึ้นโครงสร้างโปรเจกต์ Frontend (Next.js + TypeScript + Tailwind CSS):**
  - [x] พัฒนาหน้าเว็บแอปครบทั้ง 4 แท็บใน `src/app/page.tsx`
  - [x] ระบบจัดการข้อมูล CRUD (เพิ่ม, แก้ไข, ระงับ, ยกเลิก, ลบรายการ) พร้อมบันทึกข้อมูลลง `localStorage`
  - [x] สร้าง SQL Schema สำหรับ Supabase (`supabase/schema.sql`) และโครงสร้าง Docker Worker (`worker/alert_worker.mjs`, `docker-compose.yml`)

---

## 🚀 Phase 2: UX Enhancement & Thai Carrier / Preset Support (สิ่งที่ต้องทำลำดับถัดไป — High Priority)
- [ ] **1. ระบบปุ่มเลือกบริการยอดฮิต (Quick Service Presets):**
  - [ ] เพิ่มปุ่มกดเลือกบริการยอดนิยมในหน้าต่างเพิ่มบริการ (เช่น Netflix, YouTube Premium, Spotify, ChatGPT Plus, Claude Pro, Canva, Disney+ Hotstar, AIS PLAY, Viu, iCloud+)
  - [ ] เมื่อกดเลือก ให้ระบบกรอกชื่อ หมวดหมู่ สกุลเงิน ราคาเริ่มต้น และลิงก์หน้ายกเลิก (`cancel_url`) ให้อัตโนมัติ
- [ ] **2. รองรับแพ็กเกจค่ายมือถือและ App Store (myAIS / True / Apple ID / Google Play):**
  - [ ] เพิ่มตัวเลือกช่องทางชำระเงิน (`payment_methods`) สำหรับ `บิล AIS (myAIS)`, `บิล True / DTAC`, `Apple App Store`, และ `Google Play Store`
  - [ ] เพิ่มตัวเลือกคำนวณ **VAT 7%** อัตโนมัติ (สำหรับแพ็กเกจเสริมใน myAIS หรือค่ายมือถือที่มักแสดงราคายังไม่รวมภาษี เช่น 199 บาท → 212.93 บาท)
  - [ ] เพิ่มช่องบันทึก **"วิธีไปกดยกเลิก (Cancellation Note)"** เช่น *"ยกเลิกในแอป myAIS > แพ็กเกจ > แพ็กเกจของฉัน"* หรือรหัสกดยกเลิก `*678#`
- [ ] **3. ปุ่มคำนวณวันหมดอายุ Free Trial อัตโนมัติ (One-Click Trial Calculator):**
  - [ ] เพิ่มปุ่มลัด `+7 วัน`, `+14 วัน`, `+30 วัน`, `+3 เดือน` ในฟอร์มเพิ่มบริการ เพื่อคำนวณ `next_billing_date` จากวันปัจจุบันให้อัตโนมัติโดยไม่ต้องนับวันในปฏิทินเอง
- [ ] **4. ระบบเลื่อนวันตัดรอบบิลอัตโนมัติเมื่อครบรอบ (Auto-Rollover Billing Date):**
  - [ ] สำหรับบริการสถานะ `active` เมื่อวันที่ปัจจุบันเลย `next_billing_date` ไปแล้ว ให้ระบบบวกเพิ่ม `+1 เดือน` (สำหรับ `monthly`) หรือ `+1 ปี` (สำหรับ `yearly`) อัตโนมัติ

---

## 🔌 Phase 3: Backend, Database & External API Integration (Medium Priority)
- [ ] **5. เชื่อมต่อฐานข้อมูล Supabase จริง (Supabase PostgreSQL & Auth):**
  - [ ] สร้างโปรเจกต์บน Supabase และรันสคริปต์ `supabase/schema.sql`
  - [ ] สร้างหน้า **Login / Sign Up** ด้วย Supabase Auth (Email / Google Login)
  - [ ] เปลี่ยนจากการเก็บข้อมูลใน `localStorage` มาดึงและบันทึกผ่านตาราง `subscriptions` และ `payment_methods` บน Supabase ตาม `user_id`
- [ ] **6. เชื่อมต่อ API อัตราแลกเปลี่ยนค่าเงินแบบ Real-Time (Exchange Rate API):**
  - [ ] ดึงเรทค่าเงิน `USD`, `EUR`, `JPY` → `THB` รายวันจากฟรี API (เช่น `open.er-api.com`) มาอัปเดตอัตโนมัติพร้อมระบบ Cache
- [ ] **7. ระบบจัดการช่องทางชำระเงิน (Payment Methods CRUD UI):**
  - [ ] เพิ่มส่วนจัดการเพิ่ม/ลบ บัตรเครดิต, เบอร์ myAIS, TrueMoney Wallet และระบุเลข 4 ตัวท้ายได้เองจากหน้าเว็บ

---

## 🤖 Phase 4: Automation Worker & Deployment (Low / Final Priority)
- [ ] **8. ระบบแจ้งเตือนอัตโนมัติ (LINE Messaging API / LINE Notify & Email):**
  - [ ] เชื่อมต่อการส่งอีเมลแจ้งเตือนจริงผ่านผู้ให้บริการ เช่น **Resend** หรือ **Nodemailer (Gmail SMTP)**
  - [ ] รองรับการแจ้งเตือน 2 จังหวะ: แจ้งเตือนปกติล่วงหน้า `3–5 วัน` และแจ้งเตือนด่วนพิเศษ `24 ชั่วโมง` ก่อนหมดเขต `Free Trial`
- [ ] **9. การนำระบบขึ้นใช้งานจริง (Deployment):**
  - [ ] Deploy ส่วน Frontend (Next.js) ขึ้นบน **Vercel**
  - [ ] รัน Background Worker (`worker/alert_worker.mjs`) บน Docker Container หรือตั้งเวลาผ่าน **GitHub Actions Cron / Supabase Edge Functions (pg_cron)** ให้ทำงานทุกวันเวลา `09:00 น.`

