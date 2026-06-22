import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import BrandMark from "./BrandMark";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/skin-labs", label: "Skin Labs" },
  { to: "/about", label: "Journal" },
];

export default function Header() {
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <header
      data-testid="site-header"
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        scrolled ? "bg-cream-50/90 backdrop-blur-md border-b border-stone-950/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" data-testid="logo-link" className="flex items-center gap-3">
            <BrandMark className="w-9 h-9" />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="serif text-[15px] tracking-wider2">FOUNDATION</span>
              <span className="eyebrow text-[8.5px] text-stone-950/60 mt-0.5">APPAREL · SKIN LABS</span>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.label.toLowerCase().replace(" ", "-")}`}
                className={({ isActive }) =>
                  `eyebrow link-u ${isActive ? "opacity-100" : "opacity-70 hover:opacity-100"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <button data-testid="search-btn" className="hidden md:block opacity-70 hover:opacity-100 transition" aria-label="Search">
            <Search size={18} strokeWidth={1.4} />
          </button>
          <NavLink to={user ? "/account" : "/login"} data-testid="account-link" className="opacity-70 hover:opacity-100 transition" aria-label={user ? "Account" : "Sign in"}>
            <User size={19} strokeWidth={1.4} />
          </NavLink>
          <button
            data-testid="open-cart-btn"
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2 opacity-90 hover:opacity-100 transition"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} strokeWidth={1.4} />
            {count > 0 && (
              <span data-testid="cart-count" className="absolute -top-2 -right-2 bg-stone-950 text-cream-50 text-[10px] font-mono w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
          <button
            data-testid="mobile-menu-btn"
            className="lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} strokeWidth={1.4} /> : <Menu size={22} strokeWidth={1.4} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        data-testid="mobile-menu"
        className={`lg:hidden overflow-hidden transition-[max-height] duration-500 ease-out bg-cream-50 border-b border-stone-950/10 ${
          menuOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <nav className="px-6 py-6 flex flex-col gap-5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="eyebrow text-stone-950">
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
