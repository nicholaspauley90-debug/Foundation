import React, { useState } from "react";
import { Sparkles, Leaf } from "lucide-react";
import { subscribeEmail } from "../lib/api";

const REF_IMG = "https://customer-assets.emergentagent.com/job_ecommerce-launch-49/artifacts/4v4u1ken_ElevenLabs_image_GPT%20Image%202_Create%20a%20cinematic%20storyboard%20.png";

const ROADMAP = [
  ["01", "Hydration Serum", "A weightless serum built around niacinamide + barrier-repair peptides. In formulation."],
  ["02", "Barrier Repair Cream", "Ceramide-rich daily moisturizer. Engineered for the routine that ends the day."],
  ["03", "Cleanse Ritual", "Gentle dual-phase cleanser. Quietly thorough. In ideation."],
];

export default function SkinLabs() {
  const [email, setEmail] = useState("");
  const [subbed, setSubbed] = useState(false);
  async function handleSub(e) {
    e.preventDefault();
    if (!email) return;
    try { await subscribeEmail(email, "skin_labs"); } catch {}
    setSubbed(true); setEmail("");
  }

  return (
    <div data-testid="skinlabs-page" className="bg-stone-950 text-cream-100 -mt-[72px] pt-[72px] relative">
      <div className="absolute inset-0 grain opacity-50 pointer-events-none" />

      <section className="relative h-[88vh] min-h-[640px] flex items-center overflow-hidden">
        <img src={REF_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 blur-[2px]" style={{ objectPosition: "50% 35%" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/85 to-stone-950" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="eyebrow text-cream-100/70 mb-8 flex items-center gap-3 animate-fade-in"><Sparkles size={14} strokeWidth={1.3} /> SKIN LABS · COMING SOON</div>
          <h1 className="serif text-[14vw] sm:text-[88px] md:text-[120px] leading-[0.92] animate-fade-up">
            The lab is<br /><span className="serif-italic font-light">still mixing.</span>
          </h1>
          <p className="mt-10 max-w-xl text-[17px] leading-relaxed text-cream-100/75 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            We're formulating Skin Labs the same way we built Foundation Apparel — slowly, precisely, and only when each piece earns its place in your routine.
          </p>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="eyebrow text-cream-100/60 mb-6">02 · THE ROADMAP</div>
        <h2 className="serif text-5xl md:text-6xl leading-[0.95] max-w-2xl">What we're building, <span className="serif-italic">slowly.</span></h2>
        <div className="grid md:grid-cols-3 gap-10 mt-16">
          {ROADMAP.map(([num, name, desc]) => (
            <div key={num} className="relative">
              <div className="eyebrow text-cream-100/40">{num}</div>
              <h3 className="serif text-2xl mt-3">{name}</h3>
              <p className="text-cream-100/65 text-[14px] leading-relaxed mt-4">{desc}</p>
              <div className="mt-6 flex items-center gap-2 eyebrow text-sage-400"><Leaf size={12} /> IN DEVELOPMENT</div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-cream-100/10">
        <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-24 md:py-32 text-center">
          <div className="eyebrow text-cream-100/60 mb-6">03 · THE FOUNDING LIST</div>
          <h2 className="serif text-4xl md:text-5xl leading-[0.95]">First batch. <span className="serif-italic">First in line.</span></h2>
          <p className="mt-6 text-cream-100/70 max-w-xl mx-auto">
            We're shipping the founding batch only to the list. Drop your email and we'll send you the formulation notes before launch.
          </p>
          <form onSubmit={handleSub} data-testid="skinlabs-form" className="mt-12 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input data-testid="skinlabs-email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="your@email.com"
              className="flex-1 bg-transparent border-b border-cream-100/30 focus:border-cream-100 outline-none py-3 font-mono text-sm text-cream-100 placeholder:text-cream-100/40" />
            <button data-testid="skinlabs-submit" className="btn-light">{subbed ? "✓ You're in" : "Join the list"}</button>
          </form>
          {subbed && <div className="eyebrow text-sage-400 mt-6">YOU'RE ON THE FOUNDING LIST.</div>}
        </div>
      </section>
    </div>
  );
}
