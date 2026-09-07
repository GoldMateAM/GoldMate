# GoldMate Final TypeScript

A premium, responsive Next.js + TypeScript + Firebase platform for GoldMate.

## Core experience

- GoldMate-specific editorial luxury design, built around the approved navy/gold brand identity
- Responsive mobile navigation and mobile product layouts
- Branded splash screen on refresh
- Armenian / English / Russian UI with persistent locale
- Public jewelry marketplace
- Product pages and order requests
- Google + email/password authentication
- Editable user profiles
- Admin-approved seller onboarding
- Seller portal, brand profile, product publishing, inventory and orders
- Seller finance area
- Hidden private family Family Vault
- Firestore + Storage security rules

## Gold Rate Center

The Rate Center uses the official Central Bank of Armenia SOAP service `ExchangeRatesLatestByISO` with `ISO=XAU`.

Only these purities are used everywhere in the project:

- 585
- 750
- 916
- 999

GoldMate buy/sell pricing is calculated from the CBA XAU reference and the admin pricing configuration stored at `settings/pricing`.

Default pricing settings:

- buy adjustment: -3%
- sell adjustment: +4%

The API route is cached/revalidated every 15 minutes and the UI also refreshes periodically.

## Firebase project

The supplied Firebase project configuration is already in `.env.local`:

`goldmate-4e910`

Enable in Firebase Console:

1. Authentication → Email/Password
2. Authentication → Google
3. Firestore Database
4. Storage

Deploy security rules:

```bash
firebase login
firebase use goldmate-4e910
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Local development

```bash
npm install
npm run dev
```

## First administrator

Register your own GoldMate user first. Then one time in Firestore → `users` → your UID set:

- `role`: `admin`
- `sellerApproved`: `true`

This one-time bootstrap is intentionally manual so there is no public self-promotion endpoint.

## Hosting

Because the project has the server-side `/api/market-rates` route, use a Next.js server host such as:

- Firebase App Hosting
- Vercel

## Security model

Frontend route hiding is only presentation. Firestore rules separately enforce access:

- users cannot self-assign admin/seller roles
- sellers cannot edit other sellers' data
- seller approval is admin-only
- products can only use 585/750/916/999 purity
- Family Vault writes are admin-only
- Family reads require admin status or explicit shared email access
