"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatNaira } from "@/catalogue/money";

type CartItem = { productId: string; variantId: string; name: string; variantLabel: string; unitPrice: number; quantity: number };

export default function CartContent() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ items: CartItem[] }>("/api/v1/shop/cart").then((result) => {
      if (result.ok) setItems(result.data.items);
      else setError(result.error.message);
    });
  }, []);

  async function checkout() {
    setBusy(true);
    setError(null);
    const result = await api<{ authorizationUrl: string | null }>("/api/v1/shop/checkout", { method: "POST", body: { idempotencyKey: crypto.randomUUID() + crypto.randomUUID() } });
    if (result.ok && result.data.authorizationUrl) window.location.assign(result.data.authorizationUrl);
    else if (!result.ok) setError(result.error.message);
    else setError("This order is already paid.");
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <h1 className="text-3xl font-semibold text-navy">Your cart</h1>
      {error ? <Alert kind="error">{error}</Alert> : null}
      {!items.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600">Your cart is empty.</p> : (
        <>
          <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {items.map((item) => <li key={`${item.productId}-${item.variantId}`} className="flex items-center justify-between gap-4 p-4"><div><p className="font-medium">{item.name}</p><p className="text-sm text-slate-600">{item.variantLabel} x {item.quantity}</p></div><p className="font-semibold">{formatNaira(item.unitPrice * item.quantity)}</p></li>)}
          </ul>
          <Button onClick={checkout} disabled={busy}>{busy ? "Preparing checkout..." : "Pay securely with Paystack"}</Button>
        </>
      )}
    </main>
  );
}
