import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import BrandMark from "../components/BrandMark";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const next = loc.state?.from || "/account";

  async function handleSubmit(e) {
    e.preventDefault(); setErr(""); setLoading(true);
    try { await login(email, password); nav(next, { replace: true }); }
    catch (e) { setErr(formatApiErrorDetail(e?.response?.data?.detail) || "Login failed"); }
    finally { setLoading(false); }
  }

  return (
    <div data-testid="login-page" className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <BrandMark className="w-10 h-10 opacity-80" />
          <div className="eyebrow text-stone-950/60 mt-6">SIGN IN</div>
          <h1 className="serif text-4xl mt-3">Welcome back.</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="eyebrow text-stone-950/60 block mb-2">Email</label>
            <input data-testid="login-email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-3 font-mono text-sm" />
          </div>
          <div>
            <label className="eyebrow text-stone-950/60 block mb-2">Password</label>
            <input data-testid="login-password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-transparent border-b border-stone-950/30 focus:border-stone-950 outline-none py-3 font-mono text-sm" />
          </div>
          {err && <div data-testid="login-error" className="text-red-700 text-[12px] font-mono">{err}</div>}
          <button data-testid="login-submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Signing in…" : <>Sign In <ArrowRight size={14}/></>}
          </button>
        </form>
        <div className="text-center mt-8 eyebrow text-stone-950/60">
          NEW HERE? <Link to="/register" className="link-u text-stone-950">Create account</Link>
        </div>
      </div>
    </div>
  );
}
