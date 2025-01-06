import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface PostForm {
  title: string;
  content: string;
}

export default function EditPost() {
  const { id } = useParams();
  const { register, handleSubmit, reset } = useForm<PostForm>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      reset({
        title: data.title,
        content: data.content,
      });
    },
  });

  const onSubmit = async (data: PostForm) => {
    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title: data.title,
          content: data.content,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post updated successfully!",
      });
      navigate(`/posts/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="container max-w-2xl mx-auto mt-8 p-4">Loading...</div>;
  }

  if (!post) {
    return <div className="container max-w-2xl mx-auto mt-8 p-4">Post not found</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <Input
            id="title"
            {...register("title", { required: true })}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Content
          </label>
          <Textarea
            id="content"
            {...register("content", { required: true })}
            className="w-full min-h-[200px]"
          />
        </div>
        <Button type="submit">Update Post</Button>
      </form>
    </div>
  );
}