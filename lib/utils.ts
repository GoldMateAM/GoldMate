export type Currency = "USD" | "AMD";

export const AMD = new Intl.NumberFormat("hy-AM", {
  style: "currency",
  currency: "AMD",
  maximumFractionDigits: 0,
});

export const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const gramsPerTroyOunce = 31.1034768;

export function slugify(v: string) {
  return v.toLowerCase().trim().replace(/[^a-z0-9\u0531-\u0587]+/g, "-").replace(/^-|-$/g, "");
}

export function cls(...x: (string | false | null | undefined)[]) {
  return x.filter(Boolean).join(" ");
}

export function metalValue(weight: number, purity: number, fineGoldGramAMD: number) {
  return weight * (purity / 999) * fineGoldGramAMD;
}

export function amountFromAMD(amountAMD: number, currency: Currency, usdAmd: number) {
  if (currency === "AMD") return Number(amountAMD || 0);
  return usdAmd > 0 ? Number(amountAMD || 0) / usdAmd : 0;
}

export function amountToAMD(amount: number, currency: Currency, usdAmd: number) {
  if (currency === "AMD") return Number(amount || 0);
  return usdAmd > 0 ? Number(amount || 0) * usdAmd : 0;
}

export function formatMoney(amountAMD: number, currency: Currency, usdAmd: number) {
  if (currency === "AMD") return AMD.format(Number(amountAMD || 0));
  if (usdAmd <= 0) return "—";
  return USD.format(Number(amountAMD || 0) / usdAmd);
}
