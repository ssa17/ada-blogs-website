import { Auth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function SignUp() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="container max-w-md mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        view="sign_up"
        redirectTo={window.location.origin}
        options={{
          emailRedirectTo: window.location.origin,
          data: {
            username: undefined
          }
        }}
        additionalData={{
          username: {
            label: 'Username',
            type: 'text',
            placeholder: 'Enter your username',
            validation: { required: true, pattern: '^[a-zA-Z0-9_-]{3,16}$' },
          }
        }}
      />
    </div>
  );
}