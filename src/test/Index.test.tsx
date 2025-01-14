import { render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Index from "../pages/Index";
import { supabase } from "@/integrations/supabase/client";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            title: 'Test Post 1',
            content: 'Test content 1',
            created_at: new Date().toISOString(),
            profiles: { username: 'testuser1' }
          },
          {
            id: '2',
            title: 'Test Post 2',
            content: 'Test content 2',
            created_at: new Date().toISOString(),
            profiles: { username: 'testuser2' }
          }
        ],
        error: null
      })
    })
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
        <Index />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Index", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("renders the welcome section", () => {
    renderComponent();
    expect(screen.getByText(/Welcome to ADA Blogs/i)).toBeInTheDocument();
  });

  it("shows sign in button for unauthenticated users", () => {
    renderComponent();
    expect(screen.getByText(/sign in to post/i)).toBeInTheDocument();
  });

  it("displays blog posts", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument();
      expect(screen.getByText('Test Post 2')).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching posts", async () => {
    // Mock a delayed response
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    });

    renderComponent();
    expect(screen.getByText(/loading posts/i)).toBeInTheDocument();
  });

  it("displays create post button for authenticated users", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: {
        session: {
          user: { 
            id: '1',
            email: 'test@test.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2021-01-01'
          },
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer'
        }
      },
      error: null
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/create a post/i)).toBeInTheDocument();
    });
  });
});