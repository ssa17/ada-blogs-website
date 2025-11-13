import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useNavigate, useParams} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {useToast} from "@/hooks/use-toast";
import {useEffect, useState, useRef} from "react";
import {Editor} from '@tinymce/tinymce-react';
import {useQuery} from "@tanstack/react-query";

interface PostForm {
    title: string;
    content: string;
}

export default function EditPost() {
    const {id} = useParams();
    const {register, handleSubmit, setValue} = useForm<PostForm>();
    const navigate = useNavigate();
    const {toast} = useToast();
    const [userId, setUserId] = useState<string | null>(null);
    const editorRef = useRef<any>(null);
    const [initialContent, setInitialContent] = useState<string>("");

    const {data: editorConfig, isLoading: isEditorLoading, error: editorError} = useQuery({
        queryKey: ['tinymce-key'],
        queryFn: async () => {
            const response = await supabase.functions.invoke('get-tinymce-key');
            if (response.error) throw response.error;
            return response.data;
        },
    });

    const {data: post, isLoading: isPostLoading, error: postError} = useQuery({
        queryKey: ['post', id],
        queryFn: async () => {
            const {data, error} = await supabase
                .from("posts")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // Set initial values only once when data is first loaded
    useEffect(() => {
        if (post && !initialContent) {
            setValue("title", post.title);
            setInitialContent(post.content);
        }
    }, [post, setValue, initialContent]);

    useEffect(() => {
        const checkAuth = async () => {
            const {data: {session}} = await supabase.auth.getSession();
            if (!session) {
                navigate("/signin");
            } else {
                setUserId(session.user.id);
            }
        };
        checkAuth();
    }, [navigate]);

    useEffect(() => {
        if (editorError || postError) {
            toast({
                title: "Error",
                description: "Failed to load the post or editor. Please try again later.",
                variant: "destructive",
            });
        }
    }, [editorError, postError, toast]);

    const onSubmit = async (data: PostForm) => {
        if (!userId) {
            toast({
                title: "Error",
                description: "You must be logged in to edit a post.",
                variant: "destructive",
            });
            return;
        }

        try {
            const {error} = await supabase
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

    if (isEditorLoading || isPostLoading) {
        return <div className="max-w-5xl mx-auto mt-8 p-4">Loading...</div>;
    }

    if (editorError || postError || !editorConfig?.apiKey || !post) {
        return (
            <div className="max-w-5xl mx-auto mt-8 p-4">
                <div className="text-red-500">Failed to load post or editor. Please try again later.</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto mt-8 px-4 md:px-6">
            <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                    </label>
                    <Input
                        id="title"
                        {...register("title", {required: true})}
                        className="w-full"
                        placeholder="Enter your post title"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                        Content
                    </label>
                    <Editor
                        apiKey={editorConfig.apiKey}
                        onInit={(evt, editor) => editorRef.current = editor}
                        initialValue={initialContent}
                        init={{
                            height: 400,
                            menubar: false,
                            plugins: [
                                'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                                'anchor', 'searchreplace', 'visualblocks', 'fullscreen',
                                'insertdatetime', 'table', 'codesample', 'help', 'wordcount'
                            ],
                            toolbar: 'undo redo | blocks | ' +
                                'bold italic underline forecolor | alignleft aligncenter alignright | ' +
                                'bullist numlist outdent indent | ' +
                                'link codesample | removeformat | help',
                            content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:14px }'
                        }}
                        onEditorChange={(content) => {
                            setValue("content", content);
                        }}
                    />
                </div>
                <Button type="submit" className="w-full md:w-auto">Update Post</Button>
            </form>
        </div>
    );
}