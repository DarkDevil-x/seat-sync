
import { createContext, useContext, useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  student_id: string | null;
  course: string | null;
  phone_number: string | null;
};

type AuthContextType = {
  session: null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  loginWithToken: (token: string, rawUser: Record<string, unknown>) => void;
};

// Safe localStorage wrappers – Safari Private Mode throws QuotaExceededError
function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* no-op in Safari private */ }
}
function lsRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* no-op in Safari private */ }
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  loginWithToken: () => {},
});

async function fetchCurrentUser(
  token: string
): Promise<{ user: User; profile: Profile } | null> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const id: string = data.id ?? data._id ?? "";
    const user: User = { id, email: data.email };
    const profile: Profile = {
      id,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      email: data.email ?? null,
      avatar_url: data.avatar_url ?? null,
      is_admin: data.is_admin ?? false,
      student_id: data.student_id ?? null,
      course: data.course ?? null,
      phone_number: data.phone_number ?? null,
    };
    return { user, profile };
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadFromToken = async () => {
    const token = lsGet("auth_token");
    if (!token) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }
    const result = await fetchCurrentUser(token);
    if (result) {
      setUser(result.user);
      setProfile(result.profile);
    } else {
      // Token is invalid or expired – clear it
      lsRemove("auth_token");
      setUser(null);
      setProfile(null);
    }
    setIsLoading(false);
  };

  // Called directly from Auth.tsx after login/register – avoids a full page
  // reload and the extra /api/auth/me round-trip by using the data already
  // returned by the login endpoint.
  const loginWithToken = (token: string, rawUser: Record<string, unknown>) => {
    lsSet("auth_token", token);
    const id = String(rawUser.id ?? rawUser._id ?? "");
    setUser({ id, email: String(rawUser.email ?? "") });
    setProfile({
      id,
      first_name: (rawUser.first_name as string | null) ?? null,
      last_name: (rawUser.last_name as string | null) ?? null,
      email: (rawUser.email as string | null) ?? null,
      avatar_url: (rawUser.avatar_url as string | null) ?? null,
      is_admin: Boolean(rawUser.is_admin),
      student_id: (rawUser.student_id as string | null) ?? null,
      course: (rawUser.course as string | null) ?? null,
      phone_number: (rawUser.phone_number as string | null) ?? null,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    loadFromToken();

    // Fallback: legacy callers can still dispatch "auth-change"
    const handleAuthChange = () => loadFromToken();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const signOut = async () => {
    const token = lsGet("auth_token");
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // JWT is stateless – discarding the token is sufficient even if the request fails
      }
    }
    lsRemove("auth_token");
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session: null, user, profile, isLoading, signOut, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
