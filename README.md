# ArthaSetu (अर्थसेतु)
> **"Bridge your money to month-end"**  
> Built for the challenge: *Broke But Functional: Survive the Month*

ArthaSetu is a modern, high-contrast, Gen Z financial survival web application designed to help young adults manage limited monthly budgets (default ₹10,000) over a 30-day period. Instead of backward-looking passive categorization, ArthaSetu acts as a forward-looking decision engine with real-time runway forecasting, safe daily allowances, and an interactive What-If simulation laboratory.

---

## 🧭 Judge's Quick Tour: 5 Things to Try First

1. **Instant Demo Launch**:  
   Click **"Try Demo Mode (Instant Sandbox)"** on the sign-in screen. Notice that all data is isolated in `localStorage` with a visible amber **"Demo mode active"** banner. The Day counter displays today's real day of the month.
2. **Log the Verification Expense (₹540)**:  
   Navigate to **Activity** (or click the Activity tab), enter `540` and type `"Zomato Biryani"` into the free-text field *"Where did you spend it?"*. Click **Record Expense**. Return to the **Dashboard** and observe:
   - **Available to spend** drops from ₹10,000 to **₹9,460**.
   - **Spent So Far** reflects **₹540**.
   - **Safe Daily Allowance** and **Month-End Forecast** recalculate automatically.
3. **Inspect the Financial Health Donut & 5-Factor Popover**:  
   On the **Dashboard**, view the animated SVG donut ring with centered score and band label (*Strong / Okay / Shaky / Critical*). Click **"How is this calculated?"** to see the 5 live factors evaluated from your real numbers (*Runway*, *Savings*, *Needs vs Wants*, *Subscriptions*, *Buffer*).
4. **Test Decisions in the What-If Lab**:  
   Go to **What-If Lab**. Type `"Weekend road trip"` and enter an amount like `₹2,500` under **Spend** (or test the **"Cancel one of my subscriptions"** toggle). Observe the dark green **Live Preview** showing instant BEFORE vs AFTER numbers with green/red deltas, a plain-language insight, and a dual-line trajectory chart. Click **"Do it"** to commit or **"Don't do it"** to discard.
5. **Simulate a Goal Contribution with Safety Verdict**:  
   Visit **Goals**, pick a goal, and click **"+ Contribute"**. Enter an amount and click **"Review"**. The finance engine modal calculates whether your remaining funds protect upcoming commitments and issues a verdict (*Safe / Tight / Not enough*). If critical, an extra confirmation checkbox is enforced before any transfer can occur.

---

## 🎯 Challenge Requirements to Feature Mapping

| Challenge Requirement | ArthaSetu Implementation | Location |
|---|---|---|
| **Gen Z ₹10,000 30-Day Budget** | Configurable ₹10,000 starting budget, 30-day cycle, Day X of 30 tracker | `src/lib/finance.ts`, `src/pages/Dashboard.tsx` |
| **Pure Finance Engine** | Single source of truth with pure mathematical functions; balance is calculated, never stored | `src/lib/finance.ts` |
| **Real Time of Day Greeting** | Dynamic greeting by time of day + user's first name | `src/pages/Dashboard.tsx` |
| **Hero Card & Risk Badge** | Dark forest green hero card with mint pill badge readable on dark green | `src/components/common/RiskBadge.tsx` |
| **Health Score (0-100)** | SVG donut ring with 5 factors (Runway, Savings, Needs vs Wants, Subscriptions, Buffer) and explanatory popover modal | `src/components/common/HealthDonut.tsx` |
| **30-Day Runway Trajectory** | Solid line for actual balance, dashed line for projected burn, run-out marker, and spare badge | `src/pages/Dashboard.tsx` |
| **Free-Text Expense Logging** | No dropdowns, no presets: user types exact title, displayed with "Day X · Date" subtitle | `src/pages/Activity.tsx` |
| **Goals & Contribution Verdict** | Inline contribute panel, modal with Safe/Tight/Critical verdicts, balance validation, and "Contribute anyway" safeguard | `src/pages/Goals.tsx` |
| **What-If Simulation Lab** | Empty inputs only, Spend/Save/Income/Subscription cancellation, dark green live preview, health pts display, dual path chart | `src/pages/WhatIfLab.tsx` |
| **Commitments & Subscriptions** | Real-time pause/cancel toggles, due days, load breakdown, auto-deduct tracking | `src/pages/Commitments.tsx` |
| **Firebase Auth + Firestore** | Real Google OAuth popup/redirect, missing env var detection banner, security rules locking `users/{uid}/**` | `src/lib/firebase.ts`, `firestore.rules` |
| **Demo Mode Isolation** | Sandboxed localStorage experience with zero cloud writes and visible banner | `src/store/budgetStore.ts` |
| **WCAG AA & Indian Currency** | Cream, Orange, Forest Green tokens; ₹ formatting with en-IN numbering and `tabular-nums` | `src/index.css`, `src/lib/finance.ts` |

---

## 🧮 Core Finance Engine Formulas

All financial logic resides in [`src/lib/finance.ts`](file:///d:/ArthaSetu/src/lib/finance.ts) as pure functions:

### 1. Calculated Remaining Balance
$$\text{remainingBalance} = \text{startingBudget} + \text{income} - \text{expenses} - \text{netSavingsTransfers}$$
*Balance is never stored in the database; it is dynamically calculated on every state change.*

### 2. Current Day & Days Left
$$\text{currentDay} = \text{clamp}\left(\left\lfloor \frac{\text{asOfDate} - \text{periodStartDate}}{86,400,000} \right\rfloor + 1, 1, \text{periodLength}\right)$$
$$\text{daysLeft} = \text{periodLength} - \text{currentDay}$$

### 3. Safe Daily Allowance
$$\text{safeDailyAllowance} = \left\lfloor \frac{\text{remainingBalance} - \text{upcomingCommitments} - \text{upcomingSubscriptions} - \text{plannedGoalContributions}}{\max(1, \text{daysLeft})} \right\rfloor$$
*Protects non-negotiable rent and upcoming bills from being spent on discretionary chai and dinners.*

### 4. Month-End Forecast
$$\text{averageDailySpend} = \frac{\text{totalExpenses}}{\text{currentDay}}$$
$$\text{monthEndForecast} = \text{round}\Big(\text{remainingBalance} - (\text{averageDailySpend} \times \text{daysLeft}) - \text{upcomingCommitments}\Big)$$
*Requires at least 3 days of recorded activity to extrapolate burn rate accurately.*

### 5. Financial Health Score (0–100)
Sum of five distinct weighted factors (0–20 points each):
- **Runway & Velocity (0–20 pts)**: Ratio of days of runway remaining to cycle days left.
- **Savings & Goals (0–20 pts)**: Percentage of targets achieved in active savings goals.
- **Needs vs Wants (0–20 pts)**: Ratio of fixed commitments to starting budget.
- **Subscription Weight (0–20 pts)**: Recurring subscription burden relative to budget.
- **Month-End Buffer (0–20 pts)**: Safe daily allowance and forecast surplus health.

Score Bands:
- **Strong**: 80–100
- **Okay**: 60–79
- **Shaky**: 40–59
- **Critical**: < 40

---

## 🎨 Theme & Typography

- **Background**: `#FFF8EC` (Warm Cream)
- **Card**: `#FFFDF7` (Soft Pearl)
- **Border**: `#EADFC8` (Sand Outline)
- **Primary Buttons / Highlights**: `#F28C28` (Warm Orange)
- **Headings & Dark Cards**: `#1F4D3A` (Deep Forest Green)
- **Mint Accent**: `#DCEBDD` (Pill badging & progress tracking)
- **Typography**: **Fraunces** for expressive headings and **DM Sans** for legible body text, loaded via Google Fonts.

---

## 🔐 Firebase Setup Instructions

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** -> **Google Sign-In Provider**.
3. Enable **Cloud Firestore** in production mode.
4. Deploy the provided [`firestore.rules`](file:///d:/ArthaSetu/firestore.rules):
   ```bash
   firebase deploy --only firestore:rules
   ```
5. Copy `.env.example` to `.env.local` and add your keys:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-app
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:...
   ```
*If any variable is omitted, the app displays a clear notification banner on `/login` without breaking.*

---

## 🛠️ Run and Build Steps

```bash
# 1. Install dependencies
npm install

# 2. Run unit & integration tests
npm run test

# 3. Start development server
npm run dev

# 4. Build for production (TypeScript check + Vite bundle)
npm run build

# 5. Preview production build
npm run preview
```

---

## 🧪 Vitest Test Suite

Run `npm run test` to verify all 9 core unit tests and end-to-end simulation suites:
- Balance deduction: `10000 - 540 = 9460; - 500 = 8960; + 1000 = 9960`
- Safe daily allowance protection
- Month-end forecast extrapolation
- 5-factor Financial Health Score calculation
- Goal contribution review verdicts and confirmation logic
- What-If Lab before vs after deltas
- End-to-end demo mode verification
