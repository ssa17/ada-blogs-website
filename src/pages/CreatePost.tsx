import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { Editor } from '@tinymce/tinymce-react';
import axios from "axios";

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
    const [aiInput, setAiInput] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [aiMessagesRemaining, setAiMessagesRemaining] = useState<number>(0);
    const [tinymceKey, setTinymceKey] = useState<string>("");

    useEffect(() => {
        const fetchKeys = async () => {
            try {
                const response = await axios.post("/api/keys");
                setTinymceKey(response.data.tinymceKey);
            } catch (error) {
                console.error("Error fetching keys:", error);
            }
        };

        fetchKeys();
    }, []);

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

    const updateMessageCounters = async () => {
        if (!userId) return;

        try {
            const { data: profileData, error: fetchError } = await supabase
                .from('profiles')
                .select('ai_message_requests, ai_messages_remaining')
                .eq('id', userId)
                .single();

            if (fetchError) {
                console.error("Failed to fetch profile data:", fetchError);
                toast({
                    title: "Error",
                    description: "Failed to fetch profile data.",
                    variant: "destructive",
                });
                return;
            }

            const currentAiMessageRequests = profileData.ai_message_requests;
            const currentAiMessagesRemaining = profileData.ai_messages_remaining;

            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ai_messages_remaining: currentAiMessagesRemaining - 1,
                    ai_message_requests: currentAiMessageRequests + 1
                })
                .eq('id', userId)
                .select();

            if (error) {
                console.error("Failed to update AI counters:", error);
                toast({
                    title: "Error",
                    description: "Failed to update AI message counters.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Success",
                    description: "AI message counters updated.",
                });
            }

        } catch (error) {
            console.error("Error updating counters:", error);
            toast({
                title: "Error",
                description: "Failed to update AI message counters.",
                variant: "destructive",
            });
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

    const generateAndAppend = async () => {
        if (!editorRef.current || !aiInput) return;

        if (aiMessagesRemaining <= 0) {
            toast({
                title: "Error",
                description: "No AI messages remaining.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);

        try {
            const response = await axios.post("/api/generate", {
                taskType: "generate",
                messages: [{ role: "user", content: aiInput }]
            });

            const generatedContent = response.data.choices[0]?.message?.content || "";

            if (generatedContent) {
                const currentContent = editorRef.current.getContent();
                editorRef.current.setContent(currentContent + generatedContent);

                await updateMessageCounters();

                toast({
                    title: "Success",
                    description: "Content generated and appended successfully!",
                });

                setAiInput("");
            } else {
                toast({
                    title: "Error",
                    description: "Failed to generate content.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error generating content:", error);
            toast({
                title: "Error",
                description: "Failed to generate content. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const refactorContent = async () => {
        if (!editorRef.current) return;

        if (aiMessagesRemaining <= 0) {
            toast({
                title: "Error",
                description: "No AI messages remaining.",
                variant: "destructive",
            });
            return;
        }

        const content = editorRef.current.getContent();
        if (!content) {
            toast({
                title: "Error",
                description: "Editor content is empty.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);

        try {
            const response = await axios.post("/api/generate", {
                taskType: "refactor",
                messages: [{ role: "user", content: content }]
            });

            const refactoredContent = response.data.choices[0]?.message?.content || "";

            if (refactoredContent) {
                editorRef.current.setContent(refactoredContent);

                await updateMessageCounters();

                toast({
                    title: "Success",
                    description: "Content refactored successfully!",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to refactor content.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error refactoring content:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto mt-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Create New Post</h1>
                <div className="text-gray-500">AI messages remaining: {aiMessagesRemaining}</div>
            </div>

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
                    <div className="flex">
                        <div className="w-3/4">
                        <Editor
                            apiKey={tinymceKey}
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
                            }}
                                onEditorChange={(content) => {
                                    setValue("content", content);
                                }}
                        />
                        </div>
                        <div className="w-1/4 pl-2">
                            <textarea
                                placeholder="Enter AI prompt"
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                className="w-full h-32 p-2 border rounded mb-2 resize-none"
                            />
                            <Button
                                type="button"
                                onClick={generateAndAppend}
                                className="w-full"
                                disabled={isGenerating}
                            >
                                {isGenerating ? "Generating..." : "Generate & Append"}
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button type="submit" className="w-full md:w-auto">Create Post</Button>
                    <Button type="button" onClick={refactorContent} className="w-full md:w-auto"
                            disabled={isGenerating}>
                        Refactor with AI
                    </Button>
                </div>
            </form>
        </div>
    );
}