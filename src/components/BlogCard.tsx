import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router-dom";

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
  const excerpt = post.content.slice(0, 150) + (post.content.length > 150 ? "..." : "");

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