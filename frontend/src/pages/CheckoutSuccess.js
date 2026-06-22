import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { checkoutStatus } from "../lib/api";
import { useCart } from "../context/CartContext";
import BrandMark from "../components/BrandMark";

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("polling"); // polling | paid | failed | expired
  const [data, setData] = useState(null);
  const attemptsRef = useRef(0);
  const { clear } = useCart();

  useEffect(() => {
    if (!sessionId) { setStatus("failed"); return; }
    let cancelled = false;
    async function poll() {
      try {
        const res = await checkoutStatus(sessionId);
        if (cancelled) return;
        setData(res);
        if (res.payment_status === "paid") { setStatus("paid"); clear(); return; }
        if (res.status === "expired") { setStatus("expired"); return; }
      } catch {}
      if (attemptsRef.current++ < 12 && !cancelled) {
        setTimeout(poll, 2000);
      } else if (!cancelled) {
        setStatus("failed");
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [sessionId, clear]);

  return (
    <div data-testid="checkout-success-page" className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center py-20">
        <BrandMark className="w-12 h-12 mx-auto opacity-80" />
        {status === "polling" && (
          <>
            <div className="eyebrow text-stone-950/60 mt-8">PROCESSING</div>
            <h1 className="serif text-4xl mt-3">Confirming your order…</h1>
            <div className="mt-8 flex justify-center gap-2">
              <span className="dot-pulse" /><span className="dot-pulse" style={{ animationDelay: "0.2s" }} /><span className="dot-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </>
        )}
        {status === "paid" && (
          <>
            <div className="eyebrow text-sage-600 mt-8">ORDER CONFIRMED</div>
            <h1 className="serif text-4xl md:text-5xl mt-3">Welcome to <span className="serif-italic">Foundation.</span></h1>
            <p className="text-stone-950/70 mt-6 leading-relaxed">
              Your order is in. You'll receive a confirmation email shortly with tracking once it ships.
            </p>
            {data?.amount_total != null && (
              <div className="mt-8 inline-flex items-baseline gap-3 font-mono text-sm">
                <span className="text-stone-950/60">TOTAL</span>
                <span className="serif text-xl">${(data.amount_total / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="mt-10 flex gap-3 justify-center">
              <Link to="/shop" className="btn-ghost">Continue Shopping</Link>
            </div>
          </>
        )}
        {(status === "failed" || status === "expired") && (
          <>
            <div className="eyebrow text-red-700 mt-8">PAYMENT NOT COMPLETED</div>
            <h1 className="serif text-4xl mt-3">Something interrupted checkout.</h1>
            <p className="text-stone-950/70 mt-6">No charge was made. Your bag is preserved — try again when you're ready.</p>
            <Link to="/cart" className="btn-primary mt-8 inline-flex">Return to Cart</Link>
          </>
        )}
      </div>
    </div>
  );
}
