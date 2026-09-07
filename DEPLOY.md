# GoldMate — deployment

1. `npm install`
2. `npm run build`
3. Deploy with your preferred Next.js host (Vercel recommended) or Firebase App Hosting.
4. Keep `.env.local` values configured in the host environment.
5. Deploy Firebase security rules with `firebase deploy --only firestore:rules,firestore:indexes,storage`.

Gold rates are served by `/api/market-rates` from the Central Bank of Armenia XAU feed and displayed only for 585 / 750 / 916 / 999 purity.

The private area is branded as **Family Vault / Ընտանեկան պահոց** and remains hidden from users without access.
