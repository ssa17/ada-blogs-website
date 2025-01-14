import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from 'vitest';
import CreatePost from "../pages/CreatePost";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { 
          session: {
            user: { id: '1', email: 'test@test.com' }
          }
        },
        error: null
      })
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null })
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ 
        data: { apiKey: 'test-api-key' },
        error: null 
      })
    }
  }
}));

// Mock TinyMCE editor
vi.mock('@tinymce/tinymce-react', () => ({
  Editor: ({ onInit, onEditorChange }: any) => {
    onInit(null, { setContent: vi.fn() });
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

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
      expect(screen.queryByText(/loading editor/i)).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId("mock-editor")).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/title/i);
    const editorTextarea = screen.getByTestId("editor-textarea");
    const submitButton = screen.getByText(/Create Post/i);

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(editorTextarea, { target: { value: 'Test Content' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('posts');
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