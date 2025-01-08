import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const checkUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase)
        .maybeSingle();

      if (error) {
        console.error('Error checking username:', error);
        return;
      }

      setUsernameAvailable(data === null);
    } catch (error) {
      console.error('Error checking username:', error);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'username') {
      await checkUsername(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!usernameAvailable) {
      toast({
        variant: "destructive",
        title: "Username not available",
        description: "Please choose a different username.",
      });
      return;
    }

    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
          emailRedirectTo: "https://syed-blogs.netlify.app/email/confirmed",
        },
      });

      if (authError) throw authError;

      // Create profile after successful signup
      if (authData.user) {
        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              username: formData.username,
              email: formData.email,
            });

        if (profileError) throw profileError;
      }

      toast({
        title: "Success!",
        description: "Please check your email to confirm your account.",
      });

      navigate("/signin");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
      <Alert className="mb-6">
        <AlertDescription>
          After signing up, you'll receive a confirmation email. Please check your inbox and confirm your account.
        </AlertDescription>
      </Alert>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <Input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            className={
              usernameAvailable !== null
                ? usernameAvailable
                  ? "border-green-500"
                  : "border-red-500"
                : ""
            }
          />
          {formData.username.length >= 3 && (
            <p className={`text-sm mt-1 ${
              usernameAvailable ? "text-green-600" : "text-red-600"
            }`}>
              {usernameAvailable
                ? "Username is available"
                : "Username is already taken"}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || !usernameAvailable}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}