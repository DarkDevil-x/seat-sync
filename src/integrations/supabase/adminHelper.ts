
import { supabase } from "./client";
import { toast } from "@/components/ui/use-toast";

/**
 * Creates an admin user with the specified email and password
 * This should only be used in a controlled environment (not production)
 */
export const createAdminUser = async (email: string, password: string) => {
  try {
    // First, create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;
    
    if (!authData.user) {
      throw new Error("Failed to create user");
    }
    
    // Set the user as admin in the profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", authData.user.id);
      
    if (updateError) throw updateError;
    
    return { success: true, message: "Admin user created successfully" };
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return { success: false, message: error.message };
  }
};

/**
 * Checks if a user has admin privileges
 */
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();
      
    if (error) throw error;
    
    return data?.is_admin === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
