import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DOMPurify from "dompurify";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(username)")
        .eq("id", id)
        .single();

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

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="container max-w-3xl mx-auto mt-8 p-4">Loading...</div>;
  }

  if (!post) {
    return <div className="container max-w-3xl mx-auto mt-8 p-4">Post not found</div>;
  }

  const isAuthor = session?.user?.id === post.author_id;

  // Configure DOMPurify to allow code blocks
  const sanitizeConfig = {
    ADD_TAGS: ['pre', 'code'],
    ADD_ATTR: ['class'],
  };

  return (
    <div className="container max-w-3xl mx-auto mt-8 p-4">
      <article className="prose lg:prose-xl max-w-none dark:prose-invert">
        <h1>{post.title}</h1>
        <div className="text-sm text-muted-foreground mb-4">
          By {post.profiles?.username} • {new Date(post.created_at).toLocaleDateString()}
        </div>
        <div 
          className="[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:text-sm [&_code]:font-mono"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(post.content, sanitizeConfig) 
          }} 
        />
      </article>
      
      {isAuthor && (
        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/posts/${id}/edit`)}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}