import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState(true);

// student id and phone number 
  const [studentId, setStudentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      navigate("/");
    }

    // Check if any admin exists in the system
    const checkAdminExists = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("is_admin", true)
          .limit(1);

        if (error) throw error;
        
        // If no admin exists, show the setup admin link
        setAdminExists(data && data.length > 0);
      } catch (error) {
        console.error("Error checking if admin exists:", error);
        // Default to assuming admin exists in case of error
        setAdminExists(true);
      }
    };

    checkAdminExists();
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            student_id: studentId,        // ✅ Add this
            phone_number: phoneNumber     // ✅ And this
          },
        },
      });
      
      if (error) throw error;
      
      // Also update the profile record with email explicitly
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            email: email,
            first_name: firstName,
            last_name: lastName,
            student_id: studentId,        // ✅ Add this
            phone_number: phoneNumber,     // ✅ And this
          })
          .eq("id", data.user.id);
          
        if (profileError) {
          console.error("Error updating profile:", profileError);
          // Don't throw here, as the sign up was successful
        }
      }
      
      toast({
        title: "Success!",
        description: "Check your email for the confirmation link.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password"
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
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
          
          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>
                  Create an account to book events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName"
                      placeholder="First Name" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName"
                      placeholder="Last Name" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
  <Label htmlFor="studentId">Student ID</Label>
  <Input 
    id="studentId"
    placeholder="Student ID" 
    value={studentId} 
    onChange={(e) => setStudentId(e.target.value)} 
    required 
  />
</div>
<div className="space-y-2">
  <Label htmlFor="phoneNumber">Phone Number</Label>
  <Input 
    id="phoneNumber"
    placeholder="Phone Number" 
    value={phoneNumber} 
    onChange={(e) => setPhoneNumber(e.target.value)} 
    required 
  />
</div>

                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailSignup">Email</Label>
                  <Input 
                    id="emailSignup"
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordSignup">Password</Label>
                  <Input 
                    id="passwordSignup"
                    type="password" 
                    placeholder="Password (min 6 characters)" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating Account..." : "Sign Up"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
