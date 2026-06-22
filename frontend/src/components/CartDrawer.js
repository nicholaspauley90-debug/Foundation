import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { createCheckout } from "../lib/api";

export default function CartDrawer() {
  const { items, removeItem, updateQty, subtotal, open, setOpen } = useCart();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function handleCheckout() {
    if (!items.length) return;
    setErr("");
    setLoading(true);
    try {
      const origin = window.location.origin;
      const payload = items.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        title: i.title,
        variant_title: i.variant_title,
        image: i.image,
        quantity: i.quantity,
      }));
      const { url } = await createCheckout(payload, origin);
      window.location.href = url;
    } catch (e) {
      setErr(e?.response?.data?.detail || "Checkout failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div data-testid="cart-drawer" className={`fixed inset-0 z-50 pointer-events-none ${open ? "" : ""}`}>
      <div
        className={`absolute inset-0 bg-stone-950/50 transition-opacity duration-500 ${open ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`absolute top-0 right-0 h-full w-full sm:w-[440px] bg-cream-50 shadow-2xl transition-transform duration-500 ease-out flex flex-col ${
          open ? "translate-x-0 pointer-events-auto" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-7 py-6 border-b border-stone-950/10">
          <div>
            <div className="eyebrow text-stone-950/60">Your Bag</div>
            <div className="serif text-2xl mt-1">{items.length === 0 ? "Empty" : `${items.length} item${items.length>1?"s":""}`}</div>
          </div>
          <button data-testid="close-cart-btn" onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100">
            <X size={22} strokeWidth={1.4} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
          {items.length === 0 && (
            <div className="text-center py-16">
              <div className="serif-italic text-xl text-stone-950/70">Nothing here yet.</div>
              <Link to="/shop" onClick={() => setOpen(false)} className="btn-ghost mt-8 inline-flex">Browse the Drop</Link>
            </div>
          )}
          {items.map((it) => (
            <div key={`${it.product_id}-${it.variant_id}`} data-testid="cart-item" className="flex gap-4">
              {it.image && <img src={it.image} alt={it.title} className="w-24 h-28 object-cover bg-cream-200" />}
              <div className="flex-1">
                <div className="serif text-[15px] leading-tight">{it.title}</div>
                {it.variant_title && <div className="eyebrow text-stone-950/50 mt-2">{it.variant_title}</div>}
                <div className="font-mono text-[13px] mt-3">${(it.unit_price * it.quantity).toFixed(2)}</div>
                <div className="flex items-center gap-3 mt-3">
                  <button data-testid="qty-decrement" onClick={() => updateQty(it.product_id, it.variant_id, it.quantity - 1)} className="border border-stone-950/20 w-7 h-7 flex items-center justify-center hover:bg-stone-950 hover:text-cream-50 transition">
                    <Minus size={12} />
                  </button>
                  <span className="font-mono text-xs w-5 text-center">{it.quantity}</span>
                  <button data-testid="qty-increment" onClick={() => updateQty(it.product_id, it.variant_id, it.quantity + 1)} className="border border-stone-950/20 w-7 h-7 flex items-center justify-center hover:bg-stone-950 hover:text-cream-50 transition">
                    <Plus size={12} />
                  </button>
                  <button data-testid="remove-item-btn" onClick={() => removeItem(it.product_id, it.variant_id)} className="ml-auto eyebrow text-stone-950/50 hover:text-stone-950">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-stone-950/10 px-7 py-6 space-y-5">
            <div className="flex justify-between font-mono text-[13px]"><span className="text-stone-950/60">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between font-mono text-[13px]"><span className="text-stone-950/60">Shipping</span><span>$6.99</span></div>
            <div className="divider-thin" />
            <div className="flex justify-between"><span className="serif text-lg">Total</span><span className="serif text-lg">${(subtotal + 6.99).toFixed(2)}</span></div>
            {err && <div data-testid="cart-error" className="text-red-700 text-[12px] font-mono">{err}</div>}
            <button data-testid="checkout-btn" disabled={loading} onClick={handleCheckout} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Redirecting…" : <>Checkout <ArrowRight size={14} /></>}
            </button>
            <button onClick={() => { setOpen(false); navigate("/cart"); }} className="block w-full text-center eyebrow opacity-60 hover:opacity-100">View Full Cart</button>
          </div>
        )}
      </aside>
    </div>
  );
}
