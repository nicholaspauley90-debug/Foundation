import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div data-testid="not-found-page" className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="eyebrow text-stone-950/60">404 · OFF-THE-DROP</div>
        <h1 className="serif text-7xl md:text-9xl mt-4 leading-none">Lost.</h1>
        <p className="text-stone-950/70 mt-6 max-w-md mx-auto">This page didn't make the drop. Head back to the foundation.</p>
        <Link to="/" className="btn-primary mt-10 inline-flex">Return Home</Link>
      </div>
    </div>
  );
}
