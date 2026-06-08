# SLU Finance - Unified Capital Ledger & Risk Operations Platform

SLU Finance is an institutional-grade, high-velocity micro-credit underwriting ledger and real-time asset balancing application built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase. The platform provides safe, complete separation of concerns between administrative credit underwriting desks and isolated customer portal accounts via custom direct database queries.

## 📁 Core Project Directory Structure

```text
slu-finance/
├── .env.local                  # Secure server environment configuration variables
├── postcss.config.js           # PostCSS configuration engine
├── tailwind.config.ts          # Tailwind v3 theme configuration presets
├── tsconfig.json               # TypeScript compiler rules configuration matrix
├── package.json                # Project tracking scripts and production dependencies
└── src/
    ├── lib/
    │   └── supabase.ts         # Initialized client-side Supabase query interface
    └── app/
        ├── layout.tsx          # Root HTML frame wrapper with core font injections
        ├── page.tsx            # Base system routing page
        ├── auth/
        │   ├── login/
        │   │   └── page.tsx    # Dual-column identifier login validation portal
        │   ├── signup/
        │   │   └── page.tsx    # Registration screen with password metric ratings
        │   └── reset/
        │       └── page.tsx    # Direct key recovery password override script
        └── dashboard/
            ├── layout.tsx      # Global admin layout sidebar routing tracking engine
            ├── page.tsx        # Book Records Desk (Ledger grid summaries)
            ├── onboarding/
            │   └── page.tsx    # Underwriting form with auto-credentials provisioning
            ├── funds/
            │   └── page.tsx    # Capital Pool influx management audit logs
            ├── analytics/
            │   └── page.tsx    # Proportional dynamic yield analytics bar charts
            ├── risk/
            │   └── page.tsx    # Arrears payment default tracking radar grid
            ├── profile/
            │   └── page.tsx    # Editable admin profile parameters portal panel
            └── client/
                └── dashboard/
                    └── page.tsx # Isolated borrower signature portal desk