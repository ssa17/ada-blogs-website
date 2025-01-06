import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link } from "react-router-dom";

interface BlogCardProps {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  author?: string;
}

export function BlogCard({ title, excerpt, date, slug, author }: BlogCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <Link to={`/posts/${slug}`}>
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {author ? `By ${author} • ${date}` : date}
          </p>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{excerpt}</p>
        </CardContent>
      </Link>
    </Card>
  );
}