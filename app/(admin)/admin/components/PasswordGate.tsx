"use client";

import { useState, useEffect } from "react";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("ht_admin_auth");
    if (stored === "true") setAuthenticated(true);
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem("ht_admin_auth", "true");
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (checking) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-black mb-2">
              HIGH TUNIS
            </h1>
            <p className="text-xs font-bold uppercase tracking-[3px] text-black/40">
              Admin Dashboard
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Enter admin password"
                className={`w-full bg-transparent border-2 ${error ? 'border-red-500' : 'border-black'} px-5 py-4 text-sm font-bold uppercase tracking-widest placeholder:text-black/20 outline-none focus:border-black transition-colors`}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-xs font-bold uppercase tracking-widest mt-3">
                  Invalid password
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[3px] py-5 hover:bg-black/80 transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
