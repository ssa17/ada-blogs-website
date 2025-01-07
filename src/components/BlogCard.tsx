import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router-dom";
import DOMPurify from "dompurify";

interface BlogCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    profiles: {
      username: string;
    };
  };
}

export function BlogCard({ post }: BlogCardProps) {
  const date = new Date(post.created_at).toLocaleDateString();
  
  // Create a temporary div to strip HTML tags for the excerpt
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = post.content;
  const textContent = tempDiv.textContent || tempDiv.innerText;
  const excerpt = textContent.slice(0, 150) + (textContent.length > 150 ? "..." : "");

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <Link to={`/posts/${post.id}`}>
        <CardHeader>
          <CardTitle className="text-2xl">{post.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {post.profiles?.username ? `By ${post.profiles.username} • ${date}` : date}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{excerpt}</p>
        </CardContent>
      </Link>
    </Card>
  );
}