"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.replace("/admin");
      router.refresh();
    } else {
      setError(
        res.status === 429
          ? "Too many attempts. Try again in 15 minutes."
          : "Invalid password"
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black mb-2">
            HIGHTUNIS
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
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Enter admin password"
              className={`w-full bg-transparent border-2 ${error ? 'border-red-500' : 'border-black'} px-5 py-4 text-sm font-bold uppercase tracking-widest placeholder:text-black/20 outline-none focus:border-black transition-colors`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-xs font-bold uppercase tracking-widest mt-3">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[3px] py-5 hover:bg-black/80 transition-colors disabled:opacity-40"
          >
            {submitting ? "Checking..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
