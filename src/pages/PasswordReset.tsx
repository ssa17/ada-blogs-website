import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useToast} from "@/hooks/use-toast";

export default function PasswordReset() {
    const navigate = useNavigate();
    const {toast} = useToast();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const token = params.get("token");
        const email = params.get("email");

        if (token && email) {
            setAccessToken(token);
            setEmail(email);
            validateToken(token, email);
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Invalid or missing token/email.",
            });
            navigate("/signin");
        }
    }, [navigate, toast]);

    const validateToken = async (token: string, email: string) => {
        try {
            const {error} = await supabase.auth.verifyOtp({
                token,
                type: 'recovery',
                email
            });
            if (error) throw error;
            setTokenValid(true);
        } catch (error) {
            console.error("Token validation error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Invalid or expired token.",
            });
            navigate("/signin");
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Passwords do not match.",
            });
            return;
        }

        setLoading(true);

        try {
            const {error} = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Your password has been successfully reset.",
            });

            navigate("/signin");
        } catch (error) {
            console.error("Password reset error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to reset password.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
                {tokenValid ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium mb-1">
                                New Password
                            </label>
                            <Input
                                id="new-password"
                                name="new-password"
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
                                Confirm Password
                            </label>
                            <Input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                ) : (
                    <p className="text-center text-red-600">Validating token...</p>
                )}
            </div>
        </div>
    );
}