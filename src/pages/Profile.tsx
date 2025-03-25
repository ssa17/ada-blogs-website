import {useNavigate} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {useQuery} from "@tanstack/react-query";
import {UsernameSection} from "@/components/profile/UsernameSection";
import {PasswordSection} from "@/components/profile/PasswordSection";
import {UserPosts} from "@/components/profile/UserPosts";
import {DangerZone} from "@/components/profile/DangerZone";

export default function Profile() {
    const navigate = useNavigate();

    const {data: session} = useQuery({
        queryKey: ["session"],
        queryFn: async () => {
            const {data: {session}} = await supabase.auth.getSession();
            return session;
        },
    });

    const {data: profile} = useQuery({
        queryKey: ["profile", session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            const {data, error} = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!session?.user?.id,
    });

    const {data: userPosts} = useQuery({
        queryKey: ["userPosts", session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return [];
            const {data, error} = await supabase
                .from("posts")
                .select("*, profiles(username)")
                .eq("author_id", session.user.id)
                .order("created_at", {ascending: false});

            if (error) throw error;
            return data;
        },
        enabled: !!session?.user?.id,
    });

    if (!session) {
        navigate("/signin");
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Profile Settings</h1>
                <div className="text-gray-500">
                    AI messages remaining: {profile?.ai_messages_remaining ?? 0}
                    <br />
                    Total requests made with AI: {profile?.ai_message_requests ?? 0}
                </div>
            </div>

            <div className="space-y-8">
                <UsernameSection profile={profile} />
                <PasswordSection />
                <UserPosts posts={userPosts || []} />
                <DangerZone />
            </div>
        </div>
    );
}