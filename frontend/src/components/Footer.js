import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import BrandMark from "./BrandMark";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative bg-stone-950 text-cream-100 mt-32">
      <div className="absolute inset-0 grain pointer-events-none" />
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-20 grid grid-cols-1 md:grid-cols-4 gap-12 relative">
        <div className="md:col-span-2 max-w-md">
          <div className="flex items-center gap-3">
            <BrandMark className="w-10 h-10" color="#F5EFE3" />
            <div>
              <div className="serif text-lg tracking-wider2">FOUNDATION</div>
              <div className="eyebrow text-[9px] text-cream-100/50 mt-1">THE FOUNDATION OF YOUR DAILY ROUTINE</div>
            </div>
          </div>
          <p className="serif-italic text-[19px] leading-relaxed text-cream-100/80 mt-8">
            Considered apparel, intentional skincare. Built for the rituals that ground us, not the noise that distracts us.
          </p>
          <div className="flex gap-4 mt-8">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition" aria-label="Instagram">
              <Instagram size={18} strokeWidth={1.3} />
            </a>
            <a href="mailto:hello@foundationlabs.co" className="opacity-70 hover:opacity-100 transition" aria-label="Email">
              <Mail size={18} strokeWidth={1.3} />
            </a>
          </div>
        </div>

        <div>
          <div className="eyebrow text-cream-100/50 mb-5">Explore</div>
          <ul className="space-y-3 serif text-[15px]">
            <li><Link to="/shop" className="link-u">Apparel</Link></li>
            <li><Link to="/skin-labs" className="link-u">Skin Labs</Link></li>
            <li><Link to="/about" className="link-u">Journal</Link></li>
          </ul>
        </div>

        <div>
          <div className="eyebrow text-cream-100/50 mb-5">Support</div>
          <ul className="space-y-3 serif text-[15px]">
            <li><a className="link-u" href="mailto:support@foundationlabs.co">Contact</a></li>
            <li><span className="opacity-70">Shipping & Returns</span></li>
            <li><span className="opacity-70">Sizing</span></li>
            <li><span className="opacity-70">Privacy</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between gap-4 eyebrow text-cream-100/50">
          <span>© {new Date().getFullYear()} Foundation Apparel & Skin Labs</span>
          <span>Made with intention · Printed on demand</span>
        </div>
      </div>
    </footer>
  );
}
