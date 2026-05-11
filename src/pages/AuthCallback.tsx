// ORPHANED - REVIEW: This component exists but has no route in App.tsx. Used by Google OAuth redirect flow — verify before deleting.
/**
 * /auth/callback
 *
 * After Google OAuth, the server redirects here with the JWT in the URL hash:
 *   /auth/callback#token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 * This page extracts the token, stores it, fires the auth-change event,
 * and redirects the user to the home page.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const hash   = window.location.hash;    // e.g. "#token=xxx"
    const search = window.location.search;  // e.g. "?error=..."

    // ── Error from OAuth flow ──────────────────────────────────────────────────
    const params = new URLSearchParams(search);
    const oauthError = params.get("error");
    if (oauthError) {
      const messages: Record<string, string> = {
        google_not_configured: "Google OAuth is not configured on this server.",
        token_exchange_failed: "Failed to exchange Google token. Please try again.",
        userinfo_failed:       "Failed to fetch Google profile. Please try again.",
        email_not_verified:    "Your Google email is not verified. Please verify it first.",
        server_error:          "An unexpected server error occurred.",
        no_code:               "Google login was cancelled.",
        access_denied:         "You cancelled the Google login.",
      };
      const msg = messages[oauthError] || `Google login failed: ${oauthError}`;
      setErrorMsg(msg);
      setStatus("error");
      toast({ title: "Sign in failed", description: msg, variant: "destructive" });
      setTimeout(() => navigate("/auth"), 3000);
      return;
    }

    // ── Success: extract token from hash ──────────────────────────────────────
    const hashParams = new URLSearchParams(hash.replace("#", "?"));
    const token = hashParams.get("token");

    if (!token) {
      setErrorMsg("No token received from Google. Please try again.");
      setStatus("error");
      setTimeout(() => navigate("/auth", { replace: true }), 3000);
      return;
    }

    // Prevent double execution in React Strict Mode
    if (localStorage.getItem("auth_token") === token) {
      return;
    }

    // Store token and notify app
    localStorage.setItem("auth_token", token);
    window.dispatchEvent(new CustomEvent("auth-change"));

    toast({
      title: "Signed in with Google 🎉",
      description: "Welcome to SeatSync!",
    });

    // Navigate to home using React Router instead of hard reload
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      {status === "loading" ? (
        <>
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Completing Google sign-in…</p>
        </>
      ) : (
        <>
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">✗</span>
          </div>
          <p className="text-destructive font-medium">{errorMsg}</p>
          <p className="text-muted-foreground text-sm">Redirecting to login…</p>
        </>
      )}
    </div>
  );
}
