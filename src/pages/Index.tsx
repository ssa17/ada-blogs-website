import { BlogCard } from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Index() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(username)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  return (
    <div className="min-h-screen">
      <section className="bg-secondary py-20">
        <div className="container">
          <h1 className="text-5xl font-bold mb-6">Welcome to ADA Blog</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Exploring testing practices and web development insights.
          </p>
          {session ? (
            <Button asChild size="lg">
              <Link to="/posts/new">Write a Post</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link to="/signin">Sign in to Write</Link>
            </Button>
          )}
        </div>
      </section>
      
      <section className="container py-16">
        <h2 className="text-3xl font-semibold mb-8">Latest Posts</h2>
        {isLoading ? (
          <div>Loading posts...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts?.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                excerpt={post.content.substring(0, 150) + "..."}
                date={new Date(post.created_at).toLocaleDateString()}
                slug={post.id}
                author={post.profiles?.username}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}