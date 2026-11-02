"use client";

import { useState } from "react";
import { Alert, Button } from "@/components/ui";
import { api } from "@/lib/client-api";
import type { PublicProduct } from "@/catalogue/serialize";
import { formatNaira } from "@/catalogue/money";

export function AddToCart({ product }: { product: PublicProduct }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    setMessage(null);
    const current = await api<{ items: { productId: string; variantId: string; quantity: number }[] }>("/api/v1/shop/cart");
    if (!current.ok) {
      setMessage(current.error.message);
      setBusy(false);
      return;
    }
    const existing = current.data.items.find((item) => item.productId === product.id && item.variantId === variantId);
    const items = current.data.items
      .filter((item) => !(item.productId === product.id && item.variantId === variantId))
      .concat({ productId: product.id, variantId, quantity: Math.min(100, (existing?.quantity ?? 0) + quantity) });
    const saved = await api("/api/v1/shop/cart", { method: "PUT", body: { items } });
    setMessage(saved.ok ? "Added to cart." : saved.error.message);
    setBusy(false);
  }

  const selected = product.variants.find((variant) => variant.id === variantId);
  if (!selected || selected.state === "out_of_stock") return <Alert kind="info">This design is currently unavailable.</Alert>;

  return (
    <div className="mt-6 space-y-3">
      {product.variants.length > 1 ? (
        <label className="block text-sm font-medium text-slate-800">
          Option
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3">
            {product.variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.state === "out_of_stock"}>{variant.label} - {variant.state === "out_of_stock" ? "Unavailable" : formatNaira(variant.price)}</option>)}
          </select>
        </label>
      ) : null}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-800">Qty <input type="number" min={1} max={100} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(100, Number(event.target.value) || 1)))} className="ml-2 min-h-11 w-20 rounded-lg border border-slate-300 px-3" /></label>
        <Button onClick={add} disabled={busy}>{busy ? "Adding..." : "Add to cart"}</Button>
      </div>
      {message ? <Alert kind={message === "Added to cart." ? "success" : "error"}>{message}</Alert> : null}
    </div>
  );
}
