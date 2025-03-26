import {useState} from "react";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useToast} from "@/hooks/use-toast";

export default function ForgotPassword() {
    const {toast} = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const {error} = await supabase.auth.resetPasswordForEmail(email);

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Password reset email sent.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to send password reset email.",
            });
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-md mx-auto mt-8 p-4">
            <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Email"}
                </Button>
            </form>
        </div>
    );
}