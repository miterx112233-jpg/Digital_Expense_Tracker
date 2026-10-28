# 🗄️ Database Schema (Supabase / PostgreSQL)

โครงสร้างตารางข้อมูลเบื้องต้นสำหรับ Digital Expense Tracker

## 1. Table: `users`
จัดการโดยระบบ Auth ของ Supabase (auth.users)
- `id` (uuid) - Primary Key
- `email` (varchar) - อีเมลผู้ใช้งาน
- `created_at` (timestamp) - วันที่สมัครสมาชิก

## 2. Table: `payment_methods`
เก็บข้อมูลช่องทางการจ่ายเงินเพื่อให้ตามไปยกเลิกได้ถูกที่
- `id` (uuid) - Primary Key
- `user_id` (uuid) - Foreign Key -> users.id
- `provider_name` (varchar) - เช่น Visa, Mastercard, TrueMoney, PayPal
- `last_four_digits` (varchar) - เลข 4 ตัวท้าย (ถ้ามี)
- `created_at` (timestamp)

## 3. Table: `subscriptions`
เก็บรายละเอียดของบริการที่สมัครไว้
- `id` (uuid) - Primary Key
- `user_id` (uuid) - Foreign Key -> users.id
- `payment_method_id` (uuid) - Foreign Key -> payment_methods.id (Nullable)
- `service_name` (varchar) - ชื่อบริการ (เช่น Netflix, Spotify)
- `price` (decimal) - ราคา
- `currency` (varchar) - สกุลเงิน (เช่น THB, USD)
- `billing_cycle` (varchar) - รอบบิล (เช่น monthly, yearly)
- `status` (varchar) - สถานะ (trial, active, paused, cancelled)
- `next_billing_date` (date) - วันที่ตัดรอบบิลถัดไป (สำคัญมากใช้สำหรับแจ้งเตือน)
- `created_at` (timestamp)