import React, { useState } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { TreePine, AtSign, KeyRound, UserRound, MoveRight, EyeIcon, EyeOffIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const authErrorMessage = (raw: string) => {
    if (/invalid api key/i.test(raw)) {
      return "Supabase API key is invalid. Set VITE_SUPABASE_PUBLISHABLE_KEY in .env (this is not your login password).";
    }
    if (/invalid login credentials/i.test(raw)) {
      return "Invalid email or password.";
    }
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseConfigured) {
      setError("Missing Supabase environment variables. Copy .env.example to .env and fill values.");
      return;
    }
    setLoading(true);
    setError("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) setError(authErrorMessage(error.message));
      else navigate("/");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(authErrorMessage(error.message));
      else navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
          <TreePine size={22} className="text-primary" />
        </div>
        <span className="font-display font-bold text-xl text-foreground">GreenCart</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card-surface p-6">
        <h2 className="font-display font-bold text-lg text-foreground text-center mb-1">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-foreground-tertiary text-[12px] text-center mb-6">
          {mode === "login" ? "Sign in to track your impact" : "Start your sustainability journey"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background-tertiary text-[13px] text-foreground placeholder:text-foreground-tertiary font-body outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          )}

          <div className="relative">
            <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background-tertiary text-[13px] text-foreground placeholder:text-foreground-tertiary font-body outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-background-tertiary text-[13px] text-foreground placeholder:text-foreground-tertiary font-body outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary">
              {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-destructive text-[11px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
            {!loading && <MoveRight size={16} />}
          </button>
        </form>

        <p className="text-[12px] text-foreground-tertiary text-center mt-4">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-primary font-semibold"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
