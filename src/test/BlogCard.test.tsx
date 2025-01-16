import {render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import {describe, it, expect} from 'vitest';
import {BlogCard} from "../components/BlogCard";

const mockPost = {
    id: '1',
    title: 'Test Post',
    content: '<p>Test content that is longer than 150 characters. '.repeat(10) + '</p>',
    created_at: '2025-01-16T18:10:00Z',
    edited_at: null,
    profiles: {
        username: 'testuser'
    }
};

describe("BlogCard", () => {
    it("renders post information correctly", () => {
        render(
            <MemoryRouter>
                <BlogCard post={mockPost}/>
            </MemoryRouter>
        );

        expect(screen.getByText(mockPost.title)).toBeInTheDocument();
        expect(screen.getByText(/By testuser • Jan 16, 2025, 06:10 PM/)).toBeInTheDocument();
    });

    it("renders truncated content", () => {
        render(
            <MemoryRouter>
                <BlogCard post={mockPost}/>
            </MemoryRouter>
        );

        const displayedContent = screen.getByText(/Test content/);
        expect(displayedContent.textContent?.length).toBeLessThan(mockPost.content.length);
        expect(displayedContent.textContent?.endsWith('...')).toBe(true);
    });

    it("handles posts without username", () => {
        const postWithoutUsername = {
            ...mockPost,
            profiles: undefined
        };

        render(
            <MemoryRouter>
                <BlogCard post={postWithoutUsername}/>
            </MemoryRouter>
        );

        expect(screen.getByText(/Jan 16, 2025, 06:10 PM/)).toBeInTheDocument();
    });

    it("strips HTML tags from content", () => {
        const postWithHtmlTags = {
            ...mockPost,
            content: '<p>Test <strong>content</strong> with <em>HTML</em> tags</p>'
        };

        render(
            <MemoryRouter>
                <BlogCard post={postWithHtmlTags}/>
            </MemoryRouter>
        );

        expect(screen.getByText(/Test content with HTML tags/)).toBeInTheDocument();
    });
});