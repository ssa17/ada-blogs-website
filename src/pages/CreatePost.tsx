import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { Editor } from '@tinymce/tinymce-react';
import { useQuery } from "@tanstack/react-query";

interface PostForm {
  title: string;
  content: string;
}

export default function CreatePost() {
  const { register, handleSubmit, setValue } = useForm<PostForm>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  const { data: editorConfig, isLoading, error } = useQuery({
    queryKey: ['tinymce-key'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('get-tinymce-key');
      if (response.error) throw response.error;
      return response.data;
    },
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load the editor. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/signin");
      } else {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  const onSubmit = async (data: PostForm) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("posts").insert({
        title: data.title,
        content: data.content,
        author_id: userId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="container max-w-2xl mx-auto mt-8 p-4">Loading editor...</div>;
  }

  if (error || !editorConfig?.apiKey) {
    return (
      <div className="container max-w-2xl mx-auto mt-8 p-4">
        <div className="text-red-500">Failed to load editor. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto mt-8 p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
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
          <Editor
            apiKey={editorConfig.apiKey}
            onInit={(evt, editor) => editorRef.current = editor}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:14px }'
            }}
            onEditorChange={(content) => {
              setValue("content", content);
            }}
          />
        </div>
        <Button type="submit">Create Post</Button>
      </form>
    </div>
  );
}