import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../lib/api";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("default");
  const [q, setQ] = useState("");

  useEffect(() => {
    listProducts().then((d) => setProducts(d.products || [])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let res = products;
    if (q.trim()) {
      const t = q.toLowerCase();
      res = res.filter((p) => p.title.toLowerCase().includes(t) || (p.tags || []).some((x) => x.toLowerCase().includes(t)));
    }
    if (sort === "price-asc") res = [...res].sort((a, b) => a.price_min - b.price_min);
    if (sort === "price-desc") res = [...res].sort((a, b) => b.price_min - a.price_min);
    if (sort === "name") res = [...res].sort((a, b) => a.title.localeCompare(b.title));
    return res;
  }, [products, q, sort]);

  return (
    <div data-testid="shop-page" className="max-w-[1440px] mx-auto px-6 md:px-10 py-14 md:py-20">
      <div className="border-b border-stone-950/10 pb-10 mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="eyebrow text-stone-950/60 mb-3">FOUNDATION DROP · 001</div>
          <h1 className="serif text-5xl md:text-7xl leading-[0.95]">Apparel</h1>
          <p className="mt-4 text-stone-950/70 max-w-md">Heavyweight basics, built to layer through the seasons.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <input
            data-testid="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the drop…"
            className="bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-2 font-mono text-sm w-48 placeholder:text-stone-950/40"
          />
          <select
            data-testid="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent border border-stone-950/20 px-3 py-2 font-mono text-xs uppercase tracking-wider focus:outline-none focus:border-stone-950"
          >
            <option value="default">SORT · FEATURED</option>
            <option value="price-asc">PRICE · LOW → HIGH</option>
            <option value="price-desc">PRICE · HIGH → LOW</option>
            <option value="name">NAME · A → Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0,1,2,3,4,5].map((i) => <div key={i} className="aspect-[4/5] bg-cream-200 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-32 text-center serif text-xl text-stone-950/60">No products match. Try a different search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16" data-testid="product-grid">
          {filtered.map((p) => (
            <Link key={p.id} to={`/product/${p.id}`} data-testid={`product-card-${p.id}`} className="product-card group">
              <div className="img-wrap relative bg-cream-200 aspect-[4/5]">
                {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
                {p.image_alt && (
                  <img src={p.image_alt} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                )}
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <h3 className="serif text-[17px] leading-tight max-w-[78%]">{p.title}</h3>
                <span className="font-mono text-[12px] whitespace-nowrap">
                  {p.price_min === p.price_max ? `$${p.price_min.toFixed(2)}` : `From $${p.price_min.toFixed(2)}`}
                </span>
              </div>
              <div className="eyebrow text-stone-950/50 mt-2">FOUNDATION · 001</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
