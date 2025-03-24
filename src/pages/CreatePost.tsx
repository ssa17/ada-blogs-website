import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { Editor } from '@tinymce/tinymce-react';
import { useQuery } from "@tanstack/react-query";
import axios from 'axios';

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

    const getOpenAIKey = async () => {
        const response = await supabase.functions.invoke('get-open-ai-key');
        if (response.error) {
            console.error('Error fetching OpenAI key:', response.error);
            toast({
                title: "Error",
                description: "Failed to retrieve OpenAI key. Please try again.",
                variant: "destructive",
            });
            throw new Error('Failed to retrieve OpenAI key');
        }
        return response.data.apiKey;
    };

    const callOpenAI = async (text: string) => {
        try {
            const apiKey = await getOpenAIKey();
            const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
                prompt: text,
                max_tokens: 100
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.choices[0].text;
        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            toast({
                title: "Error",
                description: "Failed to process text with OpenAI. Please try again.",
                variant: "destructive",
            });
            return text;
        }
    };

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

    const handleProcessText = async () => {
        if (editorRef.current) {
            const content = editorRef.current.getContent();
            const processedContent = await callOpenAI(content);
            editorRef.current.setContent(processedContent);
        }
    };

    if (isLoading) {
        return <div className="max-w-5xl mx-auto mt-8 p-4">Loading editor...</div>;
    }

    if (error || !editorConfig?.apiKey) {
        return (
            <div className="max-w-5xl mx-auto mt-8 p-4">
                <div className="text-red-500">Failed to load editor. Please try again later.</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto mt-8 px-4 md:px-6">
            <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                    </label>
                    <Input
                        id="title"
                        {...register("title", { required: true })}
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
                            content_style: 'body { font-family:Inter,Arial,sans-serif; font-size:14px }',
                            codesample_languages: [
                                { text: 'HTML/XML', value: 'markup' },
                                { text: 'JavaScript', value: 'javascript' },
                                { text: 'CSS', value: 'css' },
                                { text: 'Python', value: 'python' },
                                { text: 'Java', value: 'java' },
                                { text: 'C', value: 'c' },
                                { text: 'C++', value: 'cpp' }
                            ]
                        }}
                        onEditorChange={(content) => {
                            setValue("content", content);
                        }}
                    />
                </div>
                <Button type="button" onClick={handleProcessText} className="w-full md:w-auto">Process Text</Button>
                <Button type="submit" className="w-full md:w-auto">Create Post</Button>
            </form>
        </div>
    );
}