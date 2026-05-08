import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Eye, EyeOff, Github } from "lucide-react";

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "bg-muted", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
  if (score === 2) return { label: "Fair", color: "bg-yellow-500", width: "50%" };
  if (score === 3) return { label: "Good", color: "bg-blue-500", width: "75%" };
  return { label: "Strong", color: "bg-green-500", width: "100%" };
}

interface PasswordInputProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  showPassword: boolean;
  onToggle: () => void;
}

function PasswordInput({ id, placeholder, value, onChange, required, minLength, showPassword, onToggle }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function friendlyError(msg: string): string {
  if (/duplicate|already exists|E11000/i.test(msg)) return "An account with this email already exists.";
  if (/invalid credentials|incorrect password|not found/i.test(msg)) return "Incorrect email or password.";
  if (/network|fetch|failed to fetch/i.test(msg)) return "Network error — please check your connection.";
  if (/password.*short|min.*6/i.test(msg)) return "Password must be at least 6 characters.";
  return msg;
}

/** Shared Google icon */
const GoogleIcon = () => (
  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/** Divider */
const OrDivider = () => (
  <div className="relative w-full">
    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-card px-2 text-muted-foreground">or continue with</span>
    </div>
  </div>
);

/** Social buttons (shared by both tabs) */
const SocialButtons = () => (
  <div className="grid grid-cols-2 gap-3 w-full">
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => { window.location.href = "/api/auth/google"; }}
      id="btn-google-signin"
    >
      <GoogleIcon />
      Google
    </Button>
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => toast({ title: "Coming soon", description: "GitHub login will be available soon." })}
      id="btn-github-signin"
    >
      <Github className="h-4 w-4 mr-2" /> GitHub
    </Button>
  </div>
);

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (user) navigate("/");

    const checkAdminExists = async () => {
      try {
        const response = await fetch("/api/auth/check-admin");
        if (!response.ok) throw new Error("Failed to check admin");
        const data = await response.json();
        setAdminExists(data.adminExists);
      } catch {
        setAdminExists(true);
      }
    };
    checkAdminExists();
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({ title: "Terms required", description: "Please accept the Terms & Privacy Policy to continue.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");
      if (rememberMe) localStorage.setItem("auth_remember", "1");
      localStorage.setItem("auth_token", data.token);
      window.dispatchEvent(new CustomEvent("auth-change"));
      toast({ title: "Welcome to SeatSync!", description: "Your account has been created." });
      window.location.href = "/events";
    } catch (error: any) {
      toast({ title: "Sign up failed", description: friendlyError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign in failed");
      if (rememberMe) localStorage.setItem("auth_remember", "1");
      localStorage.setItem("auth_token", data.token);
      window.dispatchEvent(new CustomEvent("auth-change"));
      toast({ title: "Welcome back!", description: "You've successfully signed in." });
      window.location.href = "/";
    } catch (error: any) {
      toast({ title: "Sign in failed", description: friendlyError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((v) => !v);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md shadow-xl">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* ─── Sign In ─── */}
          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your SeatSync account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => toast({ title: "Reset link sent", description: "Check your email (feature coming soon)." })}>
                      Forgot password?
                    </button>
                  </div>
                  <PasswordInput id="password" placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)} required
                    showPassword={showPassword} onToggle={togglePassword} />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="rememberMe" checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(Boolean(v))} />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading} id="btn-signin">
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
                <OrDivider />
                <SocialButtons />
                {!adminExists && (
                  <div className="text-center w-full">
                    <Link to="/admin-setup" className="text-sm text-primary hover:underline">
                      Set up admin account
                    </Link>
                  </div>
                )}
              </CardFooter>
            </form>
          </TabsContent>

          {/* ─── Sign Up ─── */}
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>Join SeatSync and start booking events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John"
                      value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe"
                      value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSignup">Email</Label>
                  <Input id="emailSignup" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordSignup">Password</Label>
                  <PasswordInput id="passwordSignup" placeholder="Min 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    showPassword={showPassword} onToggle={togglePassword} />
                  {password.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: strength.width }} />
                      </div>
                      <p className={`text-xs font-medium ${
                        strength.label === "Weak" ? "text-red-500" :
                        strength.label === "Fair" ? "text-yellow-500" :
                        strength.label === "Good" ? "text-blue-500" : "text-green-500"
                      }`}>{strength.label} password</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="rememberMeUp" checked={rememberMe}
                    onCheckedChange={(v) => setRememberMe(Boolean(v))} />
                  <Label htmlFor="rememberMeUp" className="text-sm font-normal cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="terms" checked={agreedToTerms}
                    onCheckedChange={(v) => setAgreedToTerms(Boolean(v))} className="mt-0.5" />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-snug">
                    I agree to the{" "}
                    <button type="button" className="text-primary hover:underline" onClick={() => toast({ title: "Terms & Conditions", description: "Available at /terms (coming soon)." })}>
                      Terms of Service
                    </button>{" "}&{" "}
                    <button type="button" className="text-primary hover:underline" onClick={() => toast({ title: "Privacy Policy", description: "Available at /privacy (coming soon)." })}>
                      Privacy Policy
                    </button>
                  </Label>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading || !agreedToTerms} id="btn-signup">
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
                <OrDivider />
                <SocialButtons />
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
