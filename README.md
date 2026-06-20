# 🎨 PixAnony

> **Express in Pixels. Anonymously.**
> PixAnony is an interactive anonymous art & social platform where users can create pixel art, send their creations privately and anonymously, publish finished pieces to a global feed, and participate in social engagements—all backed by deep, database-level privacy controls.

---

## 🌟 Key Features

*   **🖌️ Rich Pixel Art Canvas Editor**
    *   **Multiple Grid Sizes:** Support for `8×8` (Easy), `16×16` (Normal), `32×32` (Advanced), `64×64` (Pro), and `128×128` (Master) canvases.
    *   **Advanced Drawing Tools:** Pencil, Eraser, Bucket Fill, Color Picker, and Shape vectors (Line, Rectangle, Circle).
    *   **Color Palettes:** Curated sets including Neon, Retro, Pastel, Sunset, GameBoy, and NES, plus custom hex colors.
    *   **Editing Utilities:** Dynamic zoom levels (50% to 3200%), workspace panning (Spacebar drag), grid toggle, layered undo/redo history, and canvas exports to PNG/JPG.
*   **🔒 Privacy-First Anonymous Delivery**
    *   Send custom artwork directly to another user anonymously.
    *   The recipient receives the art, but the sender's identity remains fully hidden and cryptographically protected via PostgreSQL Row-Level Security (RLS) policies.
*   **💬 Public Gallery & Social Feed**
    *   Publish completed drawings to the community feed.
    *   Filter feed via tabs: *For You*, *Following*, *Trending*, and *Recent*.
    *   Interact with other creators through comments, likes, and reposts.
*   **✉️ Direct Messaging & Notifications**
    *   Private messaging channels with support for sending pixel art directly.
    *   Real-time notifications for followers, likes, comments, and incoming anonymous art.
*   **⚙️ Custom Profiles & Themes**
    *   Personalized `@username` routes (e.g., `/profile/username`).
    *   Full account management: bio updates, custom avatar uploads, and dynamic appearance themes (light/dark mode).

---

## 🛠️ Technology Stack

*   **Frontend Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Realtime, Row-Level Security policies)

---

## 🚀 Getting Started

Follow these steps to set up and run the PixAnony application locally:

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
*   [npm](https://www.npmjs.com/) (or yarn / pnpm)

### 2. Clone the Repository
```bash
git clone https://github.com/nader035/PixAnony.git
cd PixAnony/pixanony-app
```

### 3. Configure Environment Variables
Copy the template environment file to create your local configurations:
```bash
cp .env.example .env.local
```
Open the newly created `.env.local` file and fill in your Supabase details:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
> 💡 *You can retrieve these values from your **Supabase Dashboard** -> **Project Settings** -> **API**.*

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🗄️ Database Provisioning (Supabase)

This repository contains ready-to-run database migrations to configure your PostgreSQL schema, trigger functions, RLS policies, and storage configurations.

To provision your database:
1. Navigate to the `supabase/migrations/` directory.
2. Apply the SQL files sequentially in your Supabase SQL Editor:
   *   [20260609000000_production_hardening.sql](file:///d:/NewNader/PixAnony/pixanony-app/supabase/migrations/20260609000000_production_hardening.sql): Establishes tables (profiles, artworks, comments, likes, follows, notifications, messages), user creation triggers, and RLS policies.
   *   [20260609001000_privacy_and_username_followup.sql](file:///d:/NewNader/PixAnony/pixanony-app/supabase/migrations/20260609001000_privacy_and_username_followup.sql): Contains updates to username normalization and profile editing access control.

---

## ☁️ Vercel Deployment Guide

PixAnony is configured out-of-the-box for seamless deployments on **Vercel**.

### Step-by-Step Vercel Setup

1. **Push your Code:** Ensure your local changes are committed and pushed to your GitHub repository.
2. **Import Project on Vercel:**
   *   Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
   *   Import the repository `PixAnony`.
   *   Specify the Root Directory as `pixanony-app` since the Next.js app is located in that subdirectory.
3. **Configure Environment Variables:**
   *   In the **Environment Variables** section during configuration, add the following two environment variables exactly as defined in `.env.local`:
     *   `NEXT_PUBLIC_SUPABASE_URL`
     *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Deploy:** Click **Deploy**. Vercel will build, optimize, and serve your application globally!
5. **Set up Supabase Redirects (Optional):**
   *   If using Supabase OAuth or Email confirmations, update your redirect URLs in **Supabase Dashboard** -> **Authentication** -> **URL Configuration** to match your new Vercel domain (e.g., `https://your-app.vercel.app/auth/callback`).
