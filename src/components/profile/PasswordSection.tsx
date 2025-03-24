import {useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useToast} from "@/hooks/use-toast";
import {supabase} from "@/integrations/supabase/client";
import {Eye, EyeOff} from "lucide-react";

export function PasswordSection() {
    const {toast} = useToast();
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) return;

        if (newPassword !== confirmPassword) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "New passwords do not match.",
            });
            return;
        }

        setLoading(true);
        try {
            // First verify the current password by attempting to sign in
            const {error: signInError} = await supabase.auth.signInWithPassword({
                email: (await supabase.auth.getUser()).data.user?.email || "",
                password: currentPassword,
            });

            if (signInError) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Current password is incorrect.",
                });
                return;
            }

            // If current password is correct, proceed with password update
            const {error} = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            toast({
                title: "Password updated",
                description: "Your password has been successfully updated.",
            });

            // Clear all password fields after successful update
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update password. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Change Password</h2>
            <div className="space-y-4">
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
                    onClick={togglePasswordVisibility}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> :
                        <Eye className="h-5 w-5" />}
                </button>
                </div>
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
                        onClick={togglePasswordVisibility}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> :
                            <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <div className="relative">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 focus:outline-none"
                        onClick={togglePasswordVisibility}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> :
                            <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <Button
                    onClick={handlePasswordChange}
                    disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                >
                    {loading ? "Updating..." : "Update Password"}
                </Button>
            </div>
        </div>
    );
}