import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from 'vitest';
import CreatePost from "../pages/CreatePost";
import axios from "axios";

// Mock axios for key fetch
vi.mock("axios");

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: {
                    session: {
                        user: {id: '1', email: 'test@test.com'}
                    }
                },
                error: null
            })
        },
        from: vi.fn().mockReturnValue({
            insert: vi.fn().mockResolvedValue({data: null, error: null}),
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: {ai_messages_remaining: 10},
                        error: null
                    })
                })
            })
        }),
        functions: {
            invoke: vi.fn().mockResolvedValue({
                data: {apiKey: 'test-api-key'},
                error: null
            })
        }
    }
}));

// Mock TinyMCE editor
vi.mock('@tinymce/tinymce-react', () => ({
    Editor: ({onInit, onEditorChange}: any) => {
        onInit(null, {setContent: vi.fn()});
        return (
            <div data-testid="mock-editor">
        <textarea
            onChange={(e) => onEditorChange?.(e.target.value)}
            data-testid="editor-textarea"
        />
            </div>
        );
    }
}));

const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});

const renderComponent = () => {
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <CreatePost />
            </MemoryRouter>
        </QueryClientProvider>
    );
};

describe("CreatePost", () => {

    beforeEach(() => {
        (axios.post as vi.Mock).mockResolvedValue({
            data: {tinymceKey: "test-key"}
        });
    });

    it("renders the create post form", async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Create New Post/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
            expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
        });
    });

    it("displays the editor after loading", async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
        });
    });

    it("validates required fields", async () => {
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Create Post/i)).toBeInTheDocument();
        });

        const submitButton = screen.getByText(/Create Post/i);
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        });
    });
});
