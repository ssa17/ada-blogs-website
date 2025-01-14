import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navbar } from "../components/Navbar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn()
    }
  }
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Navbar", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it("renders navigation links", () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText("ADA Blogs")).toBeInTheDocument();
  });

  it("shows sign in when user is not authenticated", () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null
    });

    renderWithProviders(<Navbar />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
  });

  it("shows correct links when user is authenticated", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
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

    renderWithProviders(<Navbar />);
    
    expect(await screen.findByText(/new post/i)).toBeInTheDocument();
    expect(await screen.findByText(/profile/i)).toBeInTheDocument();
    expect(await screen.findByText(/sign out/i)).toBeInTheDocument();
  });

  it("handles sign out correctly", async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.auth.signOut).mockImplementation(mockSignOut);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
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

    renderWithProviders(<Navbar />);
    
    const signOutButton = await screen.findByText(/sign out/i);
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });
});