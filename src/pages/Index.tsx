import { BlogCard } from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SAMPLE_POSTS = [
  {
    title: "Getting Started with Testing in React",
    excerpt: "Learn the fundamentals of testing React applications with Jest and React Testing Library.",
    date: "March 14, 2024",
    slug: "getting-started-with-testing"
  },
  {
    title: "Understanding E2E Testing with Playwright",
    excerpt: "A comprehensive guide to end-to-end testing using Playwright.",
    date: "March 13, 2024",
    slug: "understanding-e2e-testing"
  },
  {
    title: "Accessibility Testing Best Practices",
    excerpt: "Discover how to ensure your web applications are accessible to everyone.",
    date: "March 12, 2024",
    slug: "accessibility-testing-best-practices"
  }
];

export default function Index() {
  return (
    <div className="min-h-screen">
      <section className="bg-secondary py-20">
        <div className="container">
          <h1 className="text-5xl font-bold mb-6">Welcome to ADA Blog</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Exploring testing practices and web development insights.
          </p>
          <Button asChild size="lg">
            <Link to="/blog/new">Write a Post</Link>
          </Button>
        </div>
      </section>
      
      <section className="container py-16">
        <h2 className="text-3xl font-semibold mb-8">Latest Posts</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_POSTS.map((post) => (
            <BlogCard key={post.slug} {...post} />
          ))}
        </div>
      </section>
    </div>
  );
}