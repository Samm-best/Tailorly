/** Money is stored as integer kobo (1 NGN = 100 kobo) so totals and Paystack amounts never suffer float errors. */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  const whole = Number.isInteger(naira);
  return `\u20A6${naira.toLocaleString("en-NG", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

/** "12,500" or "12500.50" -> kobo. Returns null for anything that is not a plain non-negative amount. */
export function parseNairaToKobo(input: string): number | null {
  const cleaned = input.trim().replace(/,/g, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

export function koboToNairaString(kobo: number): string {
  return (kobo / 100).toFixed(2).replace(/\.00$/, "");
}
