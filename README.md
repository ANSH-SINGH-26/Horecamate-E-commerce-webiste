# 🛒 Modern E-Commerce Platform

A full-stack, scalable e-commerce platform built with React, Vite, TypeScript, and Express. It features a complete shopping experience for users, alongside a comprehensive Admin Dashboard for managing products, orders, users, and business analytics.

## ✨ Features

### 🛍️ User/Customer Experience
*   **Authentication:** Secure sign-up and login powered by Supabase Auth.
*   **Product Discovery:** Browse products with advanced fuzzy search (powered by `fuse.js`).
*   **Shopping Cart:** Persistent shopping cart state management using Zustand.
*   **Checkout Flow:** Seamless checkout process capturing shipping details.
*   **Order Tracking:** Users can view their order history and current status (Pending, Negotiating, Processing, Out of Delivery, Completed, Cancelled).

### 🛡️ Admin Dashboard
*   **Analytics Overview:** Visualized business metrics and sales data using `recharts`.
*   **Order Management:** Update order statuses, manage fulfillment, and handle customer negotiations.
*   **Product Management:** Add, edit, delete products, and bulk-import inventory using CSV (powered by `papaparse`).
*   **User Management:** View registered customers and manage user roles.

### 🤖 Smart Features & Notifications
*   **AI Integration:** Integrated with Google GenAI (Gemini) for smart capabilities (e.g., product recommendations, AI-driven descriptions).
*   **Email Notifications:** Order confirmations and status updates sent via `nodemailer`.
*   **SMS Alerts:** Real-time customer SMS notifications powered by `twilio`.

## 🚀 Tech Stack

**Frontend:**
*   **Framework:** React 19, Vite
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (v4) & `clsx` / `tailwind-merge`
*   **State Management:** Zustand
*   **Routing:** React Router v7
*   **Animations:** Motion (Framer)
*   **Icons:** Lucide React
*   **Charts:** Recharts

**Backend & Infrastructure:**
*   **Server:** Node.js with Express
*   **Database & Auth:** Supabase (PostgreSQL)
*   **Bundler:** ESBuild (for server compilation)

## 📦 Prerequisites

Ensure you have the following installed on your local machine:
*   [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) 
*   A [Supabase](https://supabase.com/) account for database and authentication.

## 🔑 Environment Variables

Create a `.env` file in the root directory and add the following variables. *Never commit this file to version control.*

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google GenAI (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Nodemailer (Email)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
