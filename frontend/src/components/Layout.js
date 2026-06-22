import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-stone-950">
      <Header />
      <CartDrawer />
      <main className="flex-1 pt-[72px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
