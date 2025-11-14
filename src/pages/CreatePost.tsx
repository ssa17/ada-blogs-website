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

    // --------------------------------------------------
    // Load TinyMCE key
    // --------------------------------------------------
    useEffect(() => {
        const fetchKeys = async () => {
            try {
                const response = await axios.post("/.netlify/functions/keys");
                setTinymceKey(response.data.tinymceKey);
            } catch (error) {
                console.error("Error fetching keys:", error);
            }
        };
        fetchKeys();
    }, []);

    // --------------------------------------------------
    // Auth check
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Fetch AI counters
    // --------------------------------------------------
    useEffect(() => {
        const fetchAiCounters = async () => {
            if (!userId) return;

            const { data, error } = await supabase
                .from("profiles")
                .select("ai_messages_remaining, ai_message_requests")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Failed to load AI counters:", error);
                return;
            }

            setAiMessagesRemaining(data.ai_messages_remaining);
        };

        fetchAiCounters();
    }, [userId]);

    // --------------------------------------------------
    // Update counters after AI usage
    // --------------------------------------------------
    const updateMessageCounters = async () => {
        if (!userId) return;

        try {
            const { data: profileData, error: fetchError } = await supabase
                .from("profiles")
                .select("ai_message_requests, ai_messages_remaining")
                .eq("id", userId)
                .single();

            if (fetchError) {
                console.error(fetchError);
                return;
            }

            const currentRemaining = profileData.ai_messages_remaining;
            const currentRequests = profileData.ai_message_requests;

            const { error } = await supabase
                .from("profiles")
                .update({
                    ai_messages_remaining: currentRemaining - 1,
                    ai_message_requests: currentRequests + 1
                })
                .eq("id", userId);

            if (error) {
                console.error("Failed to update counters:", error);
                return;
            }

            // Update local UI immediately
            setAiMessagesRemaining(currentRemaining - 1);

        } catch (error) {
            console.error("Error updating counters:", error);
        }
    };

    // --------------------------------------------------
    // Submit post
    // --------------------------------------------------
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
        } catch {
            toast({
                title: "Error",
                description: "Failed to create post.",
                variant: "destructive",
            });
        }
    };

    // --------------------------------------------------
    // Generate & Append
    // --------------------------------------------------
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
            const response = await axios.post("/.netlify/functions/generate", {
                taskType: "generate",
                messages: [{ role: "user", content: aiInput }]
            });

            const generatedContent = response.data.choices?.[0]?.message?.content || "";

            if (generatedContent) {
                editorRef.current.setContent(
                    editorRef.current.getContent() + generatedContent
                );

                await updateMessageCounters();
                setAiInput("");

                toast({
                    title: "Success",
                    description: "Content generated!",
                });
            }
        } catch (error) {
            console.error("Generate error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // --------------------------------------------------
    // Refactor
    // --------------------------------------------------
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
        if (!content) return;

        setIsGenerating(true);

        try {
            const response = await axios.post("/api/generate", {
                taskType: "refactor",
                messages: [{ role: "user", content }]
            });

            const newContent = response.data.choices?.[0]?.message?.content || "";

            if (newContent) {
                editorRef.current.setContent(newContent);
                await updateMessageCounters();
                toast({
                    title: "Success",
                    description: "Content refactored!",
                });
            }
        } catch (error) {
            console.error("Refactor error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    // --------------------------------------------------
    // UI
    // --------------------------------------------------
    return (
        <div className="max-w-5xl mx-auto mt-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Create New Post</h1>
                <div className="text-gray-500">
                    AI messages remaining: {aiMessagesRemaining}
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="post-title" className="block text-sm font-medium text-gray-700">
                        Title
                    </label>
                    <Input
                        id="post-title"
                        {...register("title", { required: true })}
                        placeholder="Enter your post title"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="post-content" className="block text-sm font-medium text-gray-700">
                        Content
                    </label>

                    <div className="flex">
                        <div className="w-3/4">
                            {tinymceKey && (
                                <Editor
                                    id="post-content"
                                    apiKey={tinymceKey}
                                    onInit={(evt, editor) => (editorRef.current = editor)}
                                    init={{
                                        height: 400,
                                        menubar: false,
                                        plugins: [
                                            "advlist", "autolink", "lists", "link", "charmap", "preview",
                                            "anchor", "searchreplace", "visualblocks", "fullscreen",
                                            "insertdatetime", "table", "codesample", "help", "wordcount"
                                        ],
                                        toolbar:
                                            "undo redo | blocks | bold italic underline forecolor | " +
                                            "alignleft aligncenter alignright | bullist numlist outdent indent | " +
                                            "link codesample | removeformat | help",
                                    }}
                                    onEditorChange={(content) => setValue("content", content)}
                                />
                            )}
                        </div>

                        {/* AI Sidebar */}
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
                    <Button type="submit">Create Post</Button>

                    <Button
                        type="button"
                        onClick={refactorContent}
                        disabled={isGenerating}
                    >
                        Refactor with AI
                    </Button>
                </div>
            </form>
        </div>
    );
}
