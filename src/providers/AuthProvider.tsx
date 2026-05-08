
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
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
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
    const token = localStorage.getItem("auth_token");
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
      localStorage.removeItem("auth_token");
      setUser(null);
      setProfile(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadFromToken();

    // Auth.tsx dispatches this event after a successful login/register
    const handleAuthChange = () => loadFromToken();
    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const signOut = async () => {
    const token = localStorage.getItem("auth_token");
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
    localStorage.removeItem("auth_token");
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session: null, user, profile, isLoading, signOut }}>
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
