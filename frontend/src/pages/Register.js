import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import BrandMark from "../components/BrandMark";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try { await register(email, password, name); nav("/account", { replace: true }); }
    catch (e) { setErr(formatApiErrorDetail(e?.response?.data?.detail) || "Registration failed"); }
    finally { setLoading(false); }
  }

  return (
    <div data-testid="register-page" className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <BrandMark className="w-10 h-10 opacity-80" />
          <div className="eyebrow text-stone-950/60 mt-6">CREATE ACCOUNT</div>
          <h1 className="serif text-4xl mt-3">Join Foundation.</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="eyebrow text-stone-950/60 block mb-2">Name</label>
            <input data-testid="register-name" required minLength={1} value={name} onChange={(e)=>setName(e.target.value)} className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-3 font-mono text-sm" />
          </div>
          <div>
            <label className="eyebrow text-stone-950/60 block mb-2">Email</label>
            <input data-testid="register-email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-3 font-mono text-sm" />
          </div>
          <div>
            <label className="eyebrow text-stone-950/60 block mb-2">Password <span className="text-stone-950/40 normal-case tracking-normal">· min 8 chars</span></label>
            <input data-testid="register-password" type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-3 font-mono text-sm" />
          </div>
          {err && <div data-testid="register-error" className="text-red-700 text-[12px] font-mono">{err}</div>}
          <button data-testid="register-submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Creating…" : <>Create Account <ArrowRight size={14}/></>}
          </button>
        </form>
        <div className="text-center mt-8 eyebrow text-stone-950/60">
          HAVE AN ACCOUNT? <Link to="/login" className="link-u text-stone-950">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
