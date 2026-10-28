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
*(จะเพิ่มคำสั่ง `npm install` และ `npm run dev` หลังจากตั้งค่าโปรเจกต์เสร็จสิ้น)*

## 📂 โครงสร้างเอกสารอื่นๆ
- ดูการออกแบบบริบทและระบบได้ที่ [CONTEXT_DESIGN.md](CONTEXT_DESIGN.md)
- ดูโครงสร้างฐานข้อมูลได้ที่ [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)