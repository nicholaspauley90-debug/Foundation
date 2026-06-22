import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Minus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { createCheckout } from "../lib/api";

export default function Cart() {
  const { items, removeItem, updateQty, subtotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleCheckout() {
    if (!items.length) return;
    setLoading(true); setErr("");
    try {
      const payload = items.map((i) => ({
        product_id: i.product_id, variant_id: i.variant_id,
        title: i.title, variant_title: i.variant_title, image: i.image, quantity: i.quantity,
      }));
      const { url } = await createCheckout(payload, window.location.origin);
      window.location.href = url;
    } catch (e) { setErr(e?.response?.data?.detail || "Checkout failed"); setLoading(false); }
  }

  return (
    <div data-testid="cart-page" className="max-w-[1200px] mx-auto px-6 md:px-10 py-14 md:py-20">
      <div className="eyebrow text-stone-950/60 mb-3">YOUR BAG</div>
      <h1 className="serif text-5xl md:text-6xl leading-tight">{items.length === 0 ? "Your bag is empty" : `${items.length} ${items.length === 1 ? "item" : "items"}`}</h1>

      {items.length === 0 ? (
        <div className="mt-12">
          <Link to="/shop" className="btn-primary">Enter The Drop <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-12 mt-12">
          <div className="md:col-span-8 divide-y divide-stone-950/10">
            {items.map((it) => (
              <div key={`${it.product_id}-${it.variant_id}`} className="py-6 flex gap-6" data-testid="cart-line">
                {it.image && <img src={it.image} alt={it.title} className="w-28 h-36 object-cover bg-cream-200" />}
                <div className="flex-1">
                  <div className="serif text-lg leading-tight">{it.title}</div>
                  {it.variant_title && <div className="eyebrow text-stone-950/50 mt-2">{it.variant_title}</div>}
                  <div className="font-mono text-sm mt-3">${(it.unit_price).toFixed(2)} ea</div>
                  <div className="mt-4 flex items-center gap-3">
                    <button onClick={() => updateQty(it.product_id, it.variant_id, it.quantity - 1)} className="border border-stone-950/20 w-7 h-7 flex items-center justify-center hover:bg-stone-950 hover:text-cream-50"><Minus size={12} /></button>
                    <span className="font-mono w-6 text-center text-xs">{it.quantity}</span>
                    <button onClick={() => updateQty(it.product_id, it.variant_id, it.quantity + 1)} className="border border-stone-950/20 w-7 h-7 flex items-center justify-center hover:bg-stone-950 hover:text-cream-50"><Plus size={12} /></button>
                    <button onClick={() => removeItem(it.product_id, it.variant_id)} className="ml-4 eyebrow text-stone-950/50 hover:text-stone-950">Remove</button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="serif text-lg">${(it.unit_price * it.quantity).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="md:col-span-4">
            <div className="bg-cream-50 border border-stone-950/10 p-7 sticky top-24 space-y-4">
              <div className="eyebrow text-stone-950/60">Order Summary</div>
              <div className="divider-thin" />
              <div className="flex justify-between font-mono text-sm"><span className="text-stone-950/60">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between font-mono text-sm"><span className="text-stone-950/60">Shipping</span><span>$6.99</span></div>
              <div className="divider-thin" />
              <div className="flex justify-between items-baseline"><span className="serif text-xl">Total</span><span className="serif text-xl">${(subtotal + 6.99).toFixed(2)}</span></div>
              {err && <div className="text-red-700 text-[12px] font-mono">{err}</div>}
              <button data-testid="cart-checkout-btn" disabled={loading} onClick={handleCheckout} className="btn-primary w-full disabled:opacity-50">
                {loading ? "Redirecting…" : <>Checkout <ArrowRight size={14} /></>}
              </button>
              <div className="eyebrow text-stone-950/50 text-center pt-2">SECURE · STRIPE</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
