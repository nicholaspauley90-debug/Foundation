import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import { listProducts, subscribeEmail } from "../lib/api";
import BrandMark from "../components/BrandMark";

const HERO_BG = "https://customer-assets.emergentagent.com/job_ecommerce-launch-49/artifacts/xk8vjk6t_Foundation%20Ad%20Background.png";
const STORY_IMG = "https://customer-assets.emergentagent.com/job_ecommerce-launch-49/artifacts/4v4u1ken_ElevenLabs_image_GPT%20Image%202_Create%20a%20cinematic%20storyboard%20.png";
const INFL_IMG = "https://customer-assets.emergentagent.com/job_ecommerce-launch-49/artifacts/jsz7nk6j_influencer%20background%202.webp";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);

  useEffect(() => {
    listProducts().then((d) => setProducts(d.products || [])).finally(() => setLoading(false));
  }, []);

  async function handleSubscribe(e) {
    e.preventDefault();
    if (!email) return;
    try { await subscribeEmail(email, "skin_labs_home"); setSubbed(true); setEmail(""); }
    catch { setSubbed(true); }
  }

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative h-[100vh] min-h-[680px] -mt-[72px] flex items-end overflow-hidden">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/55 to-stone-950/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/30 via-transparent to-cream-100" />
        <div className="absolute inset-0 grain" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pb-24 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-8 animate-fade-in">
              <span className="w-12 h-px bg-cream-50/60" />
              <span className="eyebrow text-cream-50/80">FOUNDATION DROP · 001</span>
            </div>
            <h1 className="serif text-cream-50 text-[14vw] sm:text-[80px] md:text-[104px] leading-[0.92] tracking-tight animate-fade-up">
              The foundation<br />
              <span className="serif-italic font-light">of your daily</span> ritual.
            </h1>
            <p className="mt-10 text-cream-50/85 max-w-xl text-[17px] leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Considered apparel. Intentional skincare. Built piece by piece, for the rituals
              that ground us. No noise. No filler. Just the essentials, made well.
            </p>
            <div className="mt-12 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <Link data-testid="hero-shop-btn" to="/shop" className="btn-primary bg-cream-50 text-stone-950 border-cream-50 hover:bg-sage-600 hover:text-cream-50 hover:border-sage-600">
                Shop The Drop <ArrowRight size={14} />
              </Link>
              <Link data-testid="hero-skinlabs-btn" to="/skin-labs" className="btn-light bg-stone-950/30 backdrop-blur-sm">View Skin Labs</Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 md:right-10 eyebrow text-cream-50/60 z-10">SCROLL · 01/04</div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-stone-950/10 bg-cream-50 overflow-hidden">
        <div className="marquee-track py-5">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-12 px-8 shrink-0">
              {["HEAVYWEIGHT COTTON", "PRINTED ON DEMAND", "MADE WITH INTENTION", "FOUNDATION · 001", "MINIMAL ESSENTIALS", "SKIN LABS · COMING SOON"].map((t, i) => (
                <React.Fragment key={i}>
                  <span className="eyebrow whitespace-nowrap">{t}</span>
                  <Leaf size={12} className="opacity-50 shrink-0" />
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
          <div>
            <div className="eyebrow text-stone-950/60 mb-3">FOUNDATION DROP / APPAREL</div>
            <h2 className="serif text-5xl md:text-6xl leading-[0.95] max-w-xl">The essentials, <span className="serif-italic">refined.</span></h2>
          </div>
          <Link to="/shop" className="link-u eyebrow flex items-center gap-2">All Products <ArrowRight size={14} /></Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0,1,2,3].map((i) => <div key={i} className="aspect-[4/5] bg-cream-200 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14" data-testid="featured-products">
            {products.slice(0, 4).map((p, i) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                data-testid={`product-card-${p.id}`}
                className="product-card group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="img-wrap relative bg-cream-200 aspect-[4/5]">
                  {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
                  {p.image_alt && (
                    <img src={p.image_alt} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  )}
                </div>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <h3 className="serif text-[16px] leading-tight max-w-[80%]">{p.title}</h3>
                  <span className="font-mono text-[12px] whitespace-nowrap">
                    {p.price_min === p.price_max ? `$${p.price_min.toFixed(2)}` : `From $${p.price_min.toFixed(2)}`}
                  </span>
                </div>
                <div className="eyebrow text-stone-950/50 mt-2">FOUNDATION · 001</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* BRAND STORY */}
      <section className="bg-stone-950 text-cream-100 relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-28 md:py-40 grid md:grid-cols-12 gap-12 relative">
          <div className="md:col-span-5">
            <div className="aspect-[3/4] overflow-hidden">
              <img src={INFL_IMG} alt="Foundation atelier" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7 flex flex-col justify-center">
            <div className="eyebrow text-cream-100/60 mb-6">02 · THE PHILOSOPHY</div>
            <h2 className="serif text-5xl md:text-6xl leading-[0.98]">
              We don't drop trends.<br />
              <span className="serif-italic">We build foundations.</span>
            </h2>
            <p className="mt-10 text-cream-100/75 text-[17px] leading-relaxed max-w-lg">
              Every piece is weighed against a single question: <em className="serif-italic">does this belong in your daily routine?</em>
              If it doesn't earn its place in the rotation, it doesn't make the drop. That's why our line is short, deliberate, and built to outlast the seasons.
            </p>
            <div className="grid grid-cols-2 gap-8 mt-12 max-w-md">
              {[
                ["220 GSM", "Heavyweight cotton"],
                ["LIMITED", "Numbered drops"],
                ["ATELIER", "Brutalist studio"],
                ["INTENTION", "Built to last"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="serif text-xl">{k}</div>
                  <div className="eyebrow text-cream-100/50 mt-1.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SKIN LABS TEASER */}
      <section className="max-w-[1440px] mx-auto px-6 md:px-10 py-28 md:py-40">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6">
            <div className="eyebrow text-stone-950/60 mb-6 flex items-center gap-3">
              <Sparkles size={14} strokeWidth={1.4} /> 03 · COMING SOON
            </div>
            <h2 className="serif text-5xl md:text-6xl leading-[0.95]">
              Skin Labs.<br />
              <span className="serif-italic">Hydration as a ritual.</span>
            </h2>
            <p className="mt-8 text-stone-950/70 text-[17px] leading-relaxed max-w-lg">
              The Hydration Serum and Barrier Repair Cream are still in the lab. Drop your email and you'll be the first to know when Skin Labs goes live — including early access to the founding batch.
            </p>
            <form onSubmit={handleSubscribe} data-testid="newsletter-form" className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                data-testid="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-3 font-mono text-sm placeholder:text-stone-950/40"
              />
              <button data-testid="newsletter-submit" className="btn-primary">{subbed ? "✓ On the list" : "Notify me"}</button>
            </form>
            {subbed && <div className="eyebrow text-sage-600 mt-4">YOU'RE ON THE FOUNDING LIST.</div>}
          </div>
          <div className="md:col-span-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[3/4] bg-cream-200 overflow-hidden">
                <img src={STORY_IMG} alt="Skin Labs reference" className="w-full h-full object-cover" style={{objectPosition: "30% 30%"}} />
              </div>
              <div className="aspect-[3/4] bg-stone-850 overflow-hidden mt-12 relative">
                <img src={STORY_IMG} alt="" className="w-full h-full object-cover" style={{objectPosition: "70% 60%"}} />
                <div className="absolute inset-0 bg-stone-950/20" />
                <div className="absolute bottom-5 left-5 right-5 text-cream-50">
                  <div className="eyebrow text-cream-50/70">VOL. I</div>
                  <div className="serif text-2xl mt-2">Minimal Essentials</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="border-t border-stone-950/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-24 flex flex-col items-center text-center">
          <BrandMark className="w-12 h-12 opacity-80" />
          <h3 className="serif text-3xl md:text-4xl mt-8 max-w-xl leading-tight">
            Small drops. <span className="serif-italic">Strong foundations.</span>
          </h3>
          <Link to="/shop" className="btn-ghost mt-10">Enter The Drop</Link>
        </div>
      </section>
    </div>
  );
}
