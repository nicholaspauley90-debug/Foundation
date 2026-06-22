import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag, Leaf } from "lucide-react";
import { getProduct } from "../lib/api";
import { useCart } from "../context/CartContext";
import Reviews from "../components/Reviews";

function getOptionMap(product) {
  const map = {};
  product.options.forEach((opt, i) => { map[opt.name] = { values: opt.values, idx: i }; });
  return map;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState({}); // option name -> value id
  const [imgIdx, setImgIdx] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    getProduct(id)
      .then((p) => {
        setProduct(p);
        // pre-select first ENABLED variant's option combo (so "Add to Bag" works on landing)
        const firstEnabled = p.variants.find((v) => v.is_enabled) || p.variants[0];
        const initial = {};
        if (firstEnabled && firstEnabled.options) {
          p.options.forEach((opt, idx) => {
            initial[opt.name] = firstEnabled.options[idx];
          });
        } else {
          p.options.forEach((opt) => {
            const first = opt.values[0];
            if (first) initial[opt.name] = first.id;
          });
        }
        setSelected(initial);
      })
      .catch(() => setErr("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const optionMap = useMemo(() => product ? getOptionMap(product) : {}, [product]);

  // find variant matching selected combo (must be enabled)
  const matchingVariant = useMemo(() => {
    if (!product) return null;
    return product.variants.find((v) => {
      if (!v.is_enabled) return false;
      const opts = v.options || [];
      return product.options.every((opt, idx) => opts[idx] === selected[opt.name]);
    });
  }, [product, selected]);

  // gallery
  const galleryImgs = useMemo(() => {
    if (!product) return [];
    return product.images.filter((i, idx) => idx < 6);
  }, [product]);

  function handleAdd() {
    if (!matchingVariant) return;
    addItem({
      product_id: product.id,
      variant_id: matchingVariant.id,
      title: product.title,
      variant_title: matchingVariant.title,
      image: galleryImgs[0]?.src,
      unit_price: matchingVariant.price,
      quantity: 1,
    });
  }

  if (loading) {
    return <div data-testid="product-loading" className="min-h-[60vh] flex items-center justify-center text-stone-950/50 serif-italic">Loading…</div>;
  }
  if (err || !product) {
    return <div className="min-h-[60vh] flex items-center justify-center serif text-2xl">Product not found</div>;
  }

  return (
    <div data-testid="product-detail" className="max-w-[1440px] mx-auto px-6 md:px-10 py-10 md:py-14">
      <Link to="/shop" className="eyebrow flex items-center gap-2 opacity-60 hover:opacity-100 mb-8"><ArrowLeft size={14} /> Back to Shop</Link>

      <div className="grid md:grid-cols-12 gap-10 md:gap-16">
        {/* Gallery */}
        <div className="md:col-span-7">
          <div className="bg-cream-200 aspect-[4/5] overflow-hidden">
            {galleryImgs[imgIdx] && (
              <img src={galleryImgs[imgIdx].src} alt={product.title} className="w-full h-full object-cover" />
            )}
          </div>
          {galleryImgs.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
              {galleryImgs.map((img, i) => (
                <button
                  key={i}
                  data-testid={`thumb-${i}`}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-20 h-24 overflow-hidden bg-cream-200 border ${imgIdx === i ? "border-stone-950" : "border-transparent"}`}
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:col-span-5 md:sticky md:top-24 md:self-start">
          <div className="eyebrow text-stone-950/60">FOUNDATION · 001</div>
          <h1 className="serif text-4xl md:text-5xl mt-3 leading-tight">{product.title}</h1>

          <div className="flex items-baseline gap-4 mt-6">
            <span className="serif text-2xl">
              {matchingVariant ? `$${matchingVariant.price.toFixed(2)}` : `From $${product.price_min.toFixed(2)}`}
            </span>
            <span className="eyebrow text-stone-950/50">USD · TAX INCL</span>
          </div>

          <div className="divider-thin my-8" />

          {product.options.map((opt) => (
            <div key={opt.name} className="mb-6" data-testid={`option-group-${opt.name}`}>
              <div className="flex items-baseline justify-between mb-3">
                <div className="eyebrow text-stone-950/60">{opt.name}</div>
                <div className="font-mono text-[11px]">
                  {opt.values.find((v) => v.id === selected[opt.name])?.title}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((v) => {
                  const isColor = (opt.name || "").toLowerCase().includes("color") && v.colors && v.colors[0];
                  const active = selected[opt.name] === v.id;
                  return (
                    <button
                      key={v.id}
                      data-testid={`option-${opt.name}-${v.id}`}
                      onClick={() => setSelected((s) => ({ ...s, [opt.name]: v.id }))}
                      className={isColor ? `w-9 h-9 rounded-full border-2 transition ${active ? "border-stone-950" : "border-stone-950/20 hover:border-stone-950/50"}` : `chip ${active ? "active" : ""}`}
                      style={isColor ? { backgroundColor: v.colors[0] } : undefined}
                      title={v.title}
                      aria-label={v.title}
                    >
                      {!isColor && v.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            data-testid="add-to-cart-btn"
            onClick={handleAdd}
            disabled={!matchingVariant}
            className="btn-primary w-full mt-6 disabled:opacity-40"
          >
            {matchingVariant ? <>Add to Bag · ${matchingVariant.price.toFixed(2)} <ShoppingBag size={14} /></> : "Sold out"}
          </button>

          <div className="mt-10">
            <div className="eyebrow text-stone-950/60 mb-3">DESCRIPTION</div>
            <p className="text-stone-950/75 leading-relaxed text-[15px]">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-10">
            {[
              ["Heavyweight", "220+ GSM"],
              ["Print on Demand", "Made to order"],
              ["Unisex Fit", "Layer-ready"],
              ["Shipping", "Worldwide · 7–14d"],
            ].map(([k, v]) => (
              <div key={k} className="border-t border-stone-950/15 pt-3">
                <div className="serif text-[15px]">{k}</div>
                <div className="eyebrow text-stone-950/50 mt-1">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 bg-cream-200/60 border border-stone-950/10 flex items-start gap-3">
            <Leaf size={16} className="mt-1 text-sage-600" />
            <p className="text-[13px] leading-relaxed text-stone-950/75">
              Every Foundation piece is printed on demand. Less waste, longer life. Made for the rotation that grounds you.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-24 border-t border-stone-950/10 pt-10 flex justify-between items-center">
        <Link to="/shop" className="link-u eyebrow"><ArrowLeft size={12} className="inline mr-2" /> All Products</Link>
        <Link to="/skin-labs" className="link-u eyebrow">Skin Labs <ArrowRight size={12} className="inline ml-2" /></Link>
      </div>

      <Reviews productId={product.id} />
    </div>
  );
}
