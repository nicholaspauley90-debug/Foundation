import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Lock } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createCheckout, trackCart, formatApiErrorDetail } from "../lib/api";

const COUNTRIES = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"],
  ["AU", "Australia"], ["DE", "Germany"], ["FR", "France"], ["IT", "Italy"],
  ["ES", "Spain"], ["NL", "Netherlands"], ["JP", "Japan"], ["MX", "Mexico"],
];

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    email: user?.email || "",
    first_name: user?.name?.split(" ")[0] || "",
    last_name: user?.name?.split(" ").slice(1).join(" ") || "",
    address1: "", address2: "", city: "", region: "", zip: "",
    country: "US", phone: "",
  });

  useEffect(() => {
    if (items.length === 0) nav("/cart", { replace: true });
  }, [items.length, nav]);

  // Track cart for abandoned-cart recovery
  useEffect(() => {
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) || items.length === 0) return;
    const t = setTimeout(() => {
      trackCart(form.email, items.map((i) => ({
        product_id: i.product_id, variant_id: i.variant_id,
        title: i.title, variant_title: i.variant_title,
        image: i.image, quantity: i.quantity,
      }))).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, [form.email, items]);

  function set(k, v) { setForm((s) => ({ ...s, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      const payload = items.map((i) => ({
        product_id: i.product_id, variant_id: i.variant_id,
        title: i.title, variant_title: i.variant_title,
        image: i.image, quantity: i.quantity,
      }));
      const { email, ...address } = form;
      const { url } = await createCheckout(payload, window.location.origin, email, address);
      window.location.href = url;
    } catch (e) {
      setErr(formatApiErrorDetail(e?.response?.data?.detail) || "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div data-testid="checkout-page" className="max-w-[1200px] mx-auto px-6 md:px-10 py-12 md:py-16">
      <Link to="/cart" className="eyebrow flex items-center gap-2 opacity-60 hover:opacity-100 mb-6"><ArrowLeft size={14}/> Back to Cart</Link>
      <div className="grid md:grid-cols-12 gap-12">
        <div className="md:col-span-7">
          <div className="eyebrow text-stone-950/60 mb-3">CHECKOUT</div>
          <h1 className="serif text-5xl md:text-6xl leading-[0.95]">Almost yours.</h1>
          {!user && (
            <p className="mt-4 text-stone-950/65">
              Have an account? <Link to="/login" state={{ from: "/checkout" }} className="link-u">Sign in</Link> for faster checkout.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <div className="eyebrow text-stone-950/60 mb-3">01 · CONTACT</div>
              <Field label="Email" required type="email" value={form.email} onChange={(v)=>set("email", v)} testid="checkout-email" />
            </div>

            <div className="pt-2">
              <div className="eyebrow text-stone-950/60 mb-3">02 · SHIPPING ADDRESS</div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" required value={form.first_name} onChange={(v)=>set("first_name", v)} testid="checkout-first-name" />
                <Field label="Last name" required value={form.last_name} onChange={(v)=>set("last_name", v)} testid="checkout-last-name" />
              </div>
              <Field label="Address" required value={form.address1} onChange={(v)=>set("address1", v)} testid="checkout-address1" />
              <Field label="Apartment, suite (optional)" value={form.address2} onChange={(v)=>set("address2", v)} testid="checkout-address2" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" required value={form.city} onChange={(v)=>set("city", v)} testid="checkout-city" />
                {form.country === "US" ? (
                  <SelectField label="State" required value={form.region} onChange={(v)=>set("region", v)} testid="checkout-region" options={US_STATES.map((s)=>[s, s])} placeholder="—" />
                ) : (
                  <Field label="State / Region" required value={form.region} onChange={(v)=>set("region", v)} testid="checkout-region" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ZIP / Postal Code" required value={form.zip} onChange={(v)=>set("zip", v)} testid="checkout-zip" />
                <SelectField label="Country" required value={form.country} onChange={(v)=>set("country", v)} testid="checkout-country" options={COUNTRIES} />
              </div>
              <Field label="Phone (for delivery updates)" value={form.phone} onChange={(v)=>set("phone", v)} testid="checkout-phone" />
            </div>

            {err && <div data-testid="checkout-error" className="text-red-700 text-[12px] font-mono">{err}</div>}

            <button data-testid="proceed-payment-btn" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Redirecting…" : <>Continue to Payment <ArrowRight size={14}/></>}
            </button>
            <div className="text-center eyebrow text-stone-950/55 flex items-center justify-center gap-2"><Lock size={12}/> SECURE PAYMENT · STRIPE</div>
          </form>
        </div>

        <aside className="md:col-span-5">
          <div className="bg-cream-50 border border-stone-950/10 p-7 md:sticky md:top-24">
            <div className="eyebrow text-stone-950/60 mb-4">YOUR BAG · {items.length} ITEM{items.length===1?"":"S"}</div>
            <div className="divide-y divide-stone-950/10">
              {items.map((it) => (
                <div key={`${it.product_id}-${it.variant_id}`} className="flex gap-3 py-3">
                  {it.image && <img src={it.image} alt="" className="w-16 h-20 object-cover bg-cream-200" />}
                  <div className="flex-1">
                    <div className="serif text-[14px] leading-tight">{it.title}</div>
                    <div className="eyebrow text-stone-950/55 mt-1">{it.variant_title}</div>
                    <div className="font-mono text-[11px] mt-1">${it.unit_price.toFixed(2)} × {it.quantity}</div>
                  </div>
                  <div className="font-mono text-[12px] whitespace-nowrap">${(it.unit_price*it.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="divider-thin my-4"/>
            <div className="space-y-2">
              <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Shipping" value="$6.99" />
              <div className="divider-thin"/>
              <div className="flex justify-between items-baseline pt-2"><span className="serif text-xl">Total</span><span className="serif text-xl">${(subtotal + 6.99).toFixed(2)}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type="text", required, testid }) {
  return (
    <div className="mt-3">
      <label className="eyebrow text-stone-950/55 block mb-1.5">{label}</label>
      <input
        data-testid={testid}
        type={type} required={required} value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-2.5 font-mono text-sm"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, required, testid, options, placeholder }) {
  return (
    <div className="mt-3">
      <label className="eyebrow text-stone-950/55 block mb-1.5">{label}</label>
      <select
        data-testid={testid}
        required={required} value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-2.5 font-mono text-sm"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([k,v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between font-mono text-[13px]">
      <span className="text-stone-950/60">{label}</span><span>{value}</span>
    </div>
  );
}
