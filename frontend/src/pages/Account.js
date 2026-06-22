import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Package } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { myOrders } from "../lib/api";

export default function Account() {
  const { user, ready, logout } = useAuth();
  const nav = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) nav("/login", { state: { from: "/account" }, replace: true });
  }, [ready, user, nav]);

  useEffect(() => {
    if (!user) return;
    myOrders().then((d) => setOrders(d.orders || [])).finally(() => setLoading(false));
  }, [user]);

  async function handleLogout() { await logout(); nav("/"); }

  if (!ready || !user) {
    return <div className="min-h-[60vh] flex items-center justify-center text-stone-950/50 serif-italic">Loading…</div>;
  }

  return (
    <div data-testid="account-page" className="max-w-[1200px] mx-auto px-6 md:px-10 py-14 md:py-20">
      <div className="flex items-end justify-between border-b border-stone-950/10 pb-10 mb-12 flex-wrap gap-4">
        <div>
          <div className="eyebrow text-stone-950/60 mb-3">YOUR ACCOUNT</div>
          <h1 className="serif text-5xl md:text-6xl leading-[0.95]">Hi, <span className="serif-italic">{user.name?.split(" ")[0] || "friend"}.</span></h1>
          <div className="mt-3 font-mono text-sm text-stone-950/60">{user.email}</div>
        </div>
        <button data-testid="logout-btn" onClick={handleLogout} className="btn-ghost"><LogOut size={14}/> Sign Out</button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="eyebrow text-stone-950/60 mb-6 flex items-center gap-3"><Package size={14}/> ORDER HISTORY</div>
          {loading ? (
            <div className="text-stone-950/50 serif-italic">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="border border-stone-950/15 p-10 text-center">
              <div className="serif text-2xl">No orders yet.</div>
              <p className="text-stone-950/65 mt-3">When you make your first purchase it'll appear here.</p>
              <Link to="/shop" className="btn-primary mt-6 inline-flex">Browse The Drop</Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-950/10">
              {orders.map((o) => (
                <div key={o.session_id} data-testid={`order-${o.session_id}`} className="py-8">
                  <div className="flex items-baseline justify-between flex-wrap gap-3 mb-4">
                    <div>
                      <div className="eyebrow text-stone-950/55">ORDER · {o.order_id}</div>
                      <div className="serif text-xl mt-1">${o.amount?.toFixed(2)}</div>
                    </div>
                    <div className="eyebrow text-stone-950/55">{o.fulfillment_status === "submitted" ? "✓ FULFILLMENT IN PROGRESS" : "PROCESSING"}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {o.items?.map((it, i) => (
                      <div key={i} className="flex gap-3">
                        {it.image && <img src={it.image} alt="" className="w-16 h-20 object-cover bg-cream-200" />}
                        <div>
                          <div className="serif text-[14px] leading-tight">{it.title}</div>
                          <div className="eyebrow text-stone-950/55 mt-1">{it.variant_title} · QTY {it.quantity}</div>
                          <div className="font-mono text-[12px] mt-1">${(it.unit_price * it.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <aside>
          <div className="bg-cream-50 border border-stone-950/10 p-6">
            <div className="eyebrow text-stone-950/60 mb-3">QUICK LINKS</div>
            <div className="flex flex-col gap-3 mt-4">
              <Link to="/shop" className="link-u serif">Continue Shopping</Link>
              <Link to="/skin-labs" className="link-u serif">Skin Labs</Link>
              <Link to="/about" className="link-u serif">Journal</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
