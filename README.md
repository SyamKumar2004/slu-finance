# SLU Finance - Autonomous Capital Allocation & Risk Operations Panel

SLU Finance is a secure, full-stack, real-time micro-finance ledger and credit underwriting application built with Next.js 13+, TypeScript, Tailwind CSS, and Supabase. The platform provides complete separation of concerns between administrative underwriting and secure, isolated customer portal views.

## 🚀 Live Application Link
👉 **Production Deployment URL:** [https://slu-finance.vercel.app/](https://slu-finance.vercel.app/)

---

## 🛠️ The Technology Stack (100% Free Tier Architecture)

We architected this platform to run entirely within powerful, industry-standard developer free tiers, allowing you to scale up your operations to thousands of entries before spending any capital:

| Platform / Tool | Operational Responsibility | Free-Tier Allowance | Cost |
| :--- | :--- | :--- | :--- |
| **Next.js 14 (App Router)** | Full-stack framework handling high-performance rendering, routing, and dynamic client/admin pages. | Open Source | **₹0** |
| **Supabase (PostgreSQL)** | Cloud relational database, core Auth engines, Row-Level Security (RLS), and dynamic query APIs. | 500MB DB storage / 50,000 monthly active users | **₹0** |
| **Vercel** | Global edge hosting with automated CI/CD deployment linked directly to your repository push actions. | Unlimited builds / 100GB monthly bandwidth | **₹0** |
| **Resend (SMTP)** | Institutional transactional email infrastructure delivering secure signup link handshakes. | 3,000 emails per month / 100 daily | **₹0** |
| **Tailwind CSS v3** | Optimized styling utility engine enforcing high-scannability and strict utility themes. | Open Source | **₹0** |
| **Lucide React** | High-fidelity iconography vector sets mapped to specific UI metric indicators. | Open Source | **₹0** |

---

## 💎 Key Features Built

### 1. Unified Authentication Gatekeeper (`src/app/auth/`)
* **Sanitized Signup & Login Screens:** Stripped all hardcoded developer context data fields from placeholders, replacing them with generic, anonymized values (`Jane Doe`, `user@example.com`) to protect user privacy.
* **Role-Based Routing Core:** The authorization pipeline checks the database profile token instantly upon a login attempt. Admins are instantly routed to `/dashboard`, while verified customers are routed strictly to `/client/dashboard`. Unauthorized role attempts are automatically blocked, and the session is terminated.

### 2. Administrative Control Deck (`src/app/dashboard/page.tsx`)
* **Real-time Metric Cards:** Dynamically calculates total capital lent out, realized yield collections, outstanding balances, and total system active users using direct database aggregation.
* **Dynamic Underwriting Form:** Automates math loops to instantly compute structural installment cycles based on principal values, cycle tenures (Daily, Weekly, Monthly), and interest rates.
* **Interactive Ledger Controls:** 
  * **Quick Reconcile:** Allows administrators to type a payment collection sum right into a ledger row and seamlessly increment the `total_collected` database balance.
  * **Dynamic Status Toggles:** Instantly toggles accounts between `Active` and `Settled_Done` with clean visual badge feedback.
  * **Permanent Deletion:** Integrates a deletion trigger that purges rows completely and permanently from the cloud database tables.

### 3. Isolated Client Desk Portal (`src/app/client/dashboard/page.tsx`)
* **Row-Level Privacy Protection:** Leverages targeted SQL query filters to ensure that logged-in clients can **only** view data matching their verified personal telephone identifier. They have absolutely zero access to other customers' accounts or corporate capital summaries.
* **Terms Agreement Signature:** Allows users to view pending financing pipelines and complete a one-click digital handshake that flips their ledger status from `Pending_Verification` to `Active`.

### 4. Enterprise-Grade Email System (SMTP Engine)
* Connected to **Resend** using secure custom SMTP relay protocols within Supabase configuration settings. This ensures that live users must verify their email inboxes to interact with the platform.

---

## 📦 What We Did: Step-by-Step Architecture Pipeline

1. **Database Schema Matrix:** Setup core relational database tables inside PostgreSQL (`user_profiles`, `live_loans`, `company_capital`) linking user authentication IDs to profile metadata rows via UUID foreign keys.
2. **Dashboard Logic Sanitization:** Completely scrubbed developer credentials from placeholders and added interactive operational features (reconciliation, structural row drop logic).
3. **Tailwind v4 Build Resolution:** Cleared out breaking dependency clashes by re-aligning `postcss.config.js` and `tailwind.config.js` back to standard v3 presets, manually purging the hidden Next.js `.next` build engine caching folder, and rebuilding from a clean state.
4. **Git Cloud Handshake:** Successfully initialized a local repository inside your active directory and executed an administrative force-push tracking step up to GitHub:
```cmd
   git remote add origin [https://github.com/SyamKumar2004/slu-finance.git](https://github.com/SyamKumar2004/slu-finance.git)
   git push -u origin main --force


## 📁 Project Directory Structure Reference
slu-finance/
├── postcss.config.js
├── tailwind.config.js
├── package.json
└── src/
    └── app/
        ├── layout.tsx
        ├── page.tsx (Home View)
        ├── dashboard/
        │   └── page.tsx (Admin Operations Deck)
        ├── client/
        │   └── dashboard/
        │       └── page.tsx (Private Customer View)
        └── auth/
            ├── login/
            │   └── page.tsx
            ├── signup/
            │   └── page.tsx
            └── reset/
                └── page.tsx