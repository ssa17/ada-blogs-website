import {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useToast} from "@/hooks/use-toast";
import {useQueryClient} from "@tanstack/react-query";
import {Eye, EyeOff} from "lucide-react";

export default function SignIn() {
    const navigate = useNavigate();
    const {toast} = useToast();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            const {data, error} = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            await queryClient.invalidateQueries({queryKey: ["session"]});

            toast({
                title: "Success!",
                description: "You have been signed in.",
            });

            navigate("/");
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Invalid email or password.",
            });
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="container max-w-md mx-auto mt-8 p-4">
            <h1 className="text-2xl font-bold mb-6">Sign In</h1>
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
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            className="pr-10"
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
                </div>
                <div className="text-left">
                    <Link to="/forgotPassword" className="text-sm text-blue-600 hover:underline">
                        Forgot Password?
                    </Link>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                </Button>
            </form>
        </div>
    );
}
