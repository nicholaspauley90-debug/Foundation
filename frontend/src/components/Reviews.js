import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getReviews, postReview, formatApiErrorDetail } from "../lib/api";

function StarBar({ rating, size = 16 }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} size={size} strokeWidth={1.4} className={n <= Math.round(rating) ? "fill-stone-950 text-stone-950" : "text-stone-950/35"} />
      ))}
    </div>
  );
}

export default function Reviews({ productId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ reviews: [], count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() { setLoading(true); getReviews(productId).then(setData).finally(() => setLoading(false)); }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [productId]);

  async function submit(e) {
    e.preventDefault(); setErr(""); setSubmitting(true);
    try {
      await postReview(productId, { rating, title, body });
      setShowForm(false); setTitle(""); setBody(""); setRating(5);
      load();
    } catch (e) {
      setErr(formatApiErrorDetail(e?.response?.data?.detail) || "Submit failed");
    } finally { setSubmitting(false); }
  }

  return (
    <section data-testid="reviews-section" className="border-t border-stone-950/15 mt-20 pt-14">
      <div className="flex items-baseline justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="eyebrow text-stone-950/60 mb-3">REVIEWS</div>
          <div className="flex items-center gap-4">
            <h2 className="serif text-4xl">{data.average > 0 ? data.average.toFixed(1) : "—"}</h2>
            <StarBar rating={data.average} size={18} />
            <div className="eyebrow text-stone-950/60">{data.count} review{data.count===1?"":"s"}</div>
          </div>
        </div>
        {user ? (
          <button data-testid="write-review-btn" onClick={() => setShowForm((v)=>!v)} className="btn-ghost">{showForm ? "Cancel" : "Write a Review"}</button>
        ) : (
          <Link to="/login" state={{ from: window.location.pathname }} className="btn-ghost" data-testid="signin-to-review">Sign in to review</Link>
        )}
      </div>

      {showForm && user && (
        <form data-testid="review-form" onSubmit={submit} className="bg-cream-50 border border-stone-950/10 p-6 mb-10 space-y-4">
          <div>
            <div className="eyebrow text-stone-950/60 mb-2">YOUR RATING</div>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button type="button" key={n} data-testid={`rate-${n}`} onClick={() => setRating(n)} className="p-1">
                  <Star size={28} strokeWidth={1.3} className={n <= rating ? "fill-stone-950 text-stone-950" : "text-stone-950/30"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="eyebrow text-stone-950/60 block mb-1.5">Title</label>
            <input data-testid="review-title" required maxLength={120} value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-2 font-mono text-sm" />
          </div>
          <div>
            <label className="eyebrow text-stone-950/60 block mb-1.5">Your Review</label>
            <textarea data-testid="review-body" required maxLength={2000} rows={4} value={body} onChange={(e)=>setBody(e.target.value)} className="w-full bg-transparent border border-stone-950/15 focus:border-stone-950 outline-none p-3 text-sm" />
          </div>
          {err && <div data-testid="review-error" className="text-red-700 font-mono text-[12px]">{err}</div>}
          <button data-testid="review-submit" disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? "Posting…" : "Post Review"}</button>
          <div className="eyebrow text-stone-950/55 flex items-center gap-2"><ShieldCheck size={12}/> VERIFIED BUYERS ONLY · Only customers who purchased can review.</div>
        </form>
      )}

      {loading ? (
        <div className="serif-italic text-stone-950/60">Loading reviews…</div>
      ) : data.reviews.length === 0 ? (
        <div className="text-stone-950/65 text-[15px]">No reviews yet. Be the first verified buyer to leave one.</div>
      ) : (
        <div className="divide-y divide-stone-950/10">
          {data.reviews.map((r) => (
            <div key={r.id} data-testid={`review-${r.id}`} className="py-6">
              <div className="flex items-center gap-3 flex-wrap">
                <StarBar rating={r.rating} />
                <span className="serif text-lg">{r.title}</span>
                {r.verified_buyer && <span className="eyebrow text-sage-600 flex items-center gap-1"><ShieldCheck size={11}/> VERIFIED</span>}
              </div>
              <div className="mt-2 eyebrow text-stone-950/55">{r.user_name} · {new Date(r.created_at).toLocaleDateString()}</div>
              <p className="mt-3 text-stone-950/80 text-[15px] leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
