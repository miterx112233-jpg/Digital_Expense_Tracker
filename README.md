# 💸 Digital Expense Tracker

แอปพลิเคชันสำหรับจัดการ Subscription และติดตามรายจ่ายดิจิทัลรายเดือน ช่วยแจ้งเตือนก่อนถึงวันตัดรอบบิล เพื่อป้องกันการถูกหักเงินจากบริการที่ไม่ได้ใช้งาน

## 🌟 ฟีเจอร์หลัก (Core Features)
- **Dashboard & Analytics:** สรุปยอดค่าใช้จ่ายรายเดือน/รายปี พร้อมแยกหมวดหมู่
- **Smart Alerts:** ระบบแจ้งเตือนล่วงหน้า 3 วันก่อนถึงกำหนดตัดเงิน (ผ่าน Email / Line Notify)
- **Free Trial Tracker:** ระบบติดตามบริการที่ทดลองใช้ฟรีและแจ้งเตือนก่อนเก็บเงินจริง
- **Multi-Currency Support:** รองรับการแปลงสกุลเงินต่างประเทศเป็นเงินบาทเบื้องต้น

## 🛠️ Tech Stack (สถาปัตยกรรมระบบ)
- **Frontend:** Next.js / React (หรือ Flutter)
- **Backend & Database:** Supabase (PostgreSQL + Auth)
- **Background Worker:** Node.js / Python (รันบน Docker สำหรับทำ Cron Job)
- **UI/UX Design:** Figma

## 🚀 การติดตั้งและรันโปรเจกต์ (Getting Started)
```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. รันเซิร์ฟเวอร์สำหรับพัฒนา (เปิดที่ http://localhost:3000)
npm run dev
```

## 📂 โครงสร้างเอกสารอื่นๆ
- ดูรายการงานที่ต้องทำทั้งหมด (Product Backlog) ได้ที่ [backlog.md](backlog.md)
- ดูภาพการออกแบบ UI ทั้ง 4 หน้าได้ที่โฟลเดอร์ [UI/](UI/)
- ดูการออกแบบบริบทและระบบได้ที่ [Context.md](Context.md)
- ดูโครงสร้างฐานข้อมูลได้ที่ [database_schema.md](database_schema.md) และไฟล์ SQL [supabase/schema.sql](supabase/schema.sql)
- ดูโค้ด Background Worker สำหรับแจ้งเตือนได้ที่ [worker/alert_worker.mjs](worker/alert_worker.mjs)
