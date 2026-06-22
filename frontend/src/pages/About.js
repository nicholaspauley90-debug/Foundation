import React from "react";
import { Link } from "react-router-dom";

const STORY_IMG = "https://customer-assets.emergentagent.com/job_ecommerce-launch-49/artifacts/jsz7nk6j_influencer%20background%202.webp";

export default function About() {
  return (
    <div data-testid="about-page">
      <section className="relative h-[60vh] min-h-[440px] -mt-[72px] flex items-end overflow-hidden">
        <img src={STORY_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-stone-950/50" />
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-10 pb-16 text-cream-50">
          <div className="eyebrow text-cream-50/70 mb-4">JOURNAL · 001</div>
          <h1 className="serif text-6xl md:text-8xl leading-[0.95]">Why we built<br /><span className="serif-italic">Foundation.</span></h1>
        </div>
      </section>

      <section className="max-w-[760px] mx-auto px-6 md:px-10 py-24 md:py-32 text-[17px] leading-[1.85] text-stone-950/85 serif">
        <p>Most brands chase trends. We wanted to build the opposite: a small line of essentials engineered for the routine that grounds you — the morning ritual, the layering basics, the products that don't need to shout.</p>
        <p className="mt-8">Foundation started in a sun-drenched studio with raw concrete walls and a single question: <em className="serif-italic">what belongs in the daily rotation?</em> Everything that didn't earn its place got cut. What's left is short, deliberate, and built to outlast the seasons.</p>
        <p className="mt-8">Skin Labs is the same philosophy, just for what touches your skin. We're still mixing, still refining. When it ships, it'll be because it deserved to.</p>
        <p className="mt-12 eyebrow text-stone-950/60">— FOUNDATION ATELIER</p>
      </section>

      <section className="border-t border-stone-950/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-20 text-center">
          <Link to="/shop" className="btn-primary">Enter The Drop</Link>
        </div>
      </section>
    </div>
  );
}
