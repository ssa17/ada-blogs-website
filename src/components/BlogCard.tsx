import {Card, CardContent, CardHeader, CardTitle} from "./ui/card";
import {Link} from "react-router-dom";

interface BlogCardProps {
    post: {
        id: string;
        title: string;
        content: string;
        created_at: string;
        edited_at: string | null;
        profiles: {
            username: string;
        };
    };
}

export function BlogCard({post}: BlogCardProps) {
    const
        formatDateTime = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

    // Strip HTML tags and create excerpt using regex
    const textContent = post.content.replace(/<[^>]+>/g, '');
    const excerpt = textContent.slice(0, 150) + (textContent.length > 150 ? "..." : "");

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <Link to={`/posts/${post.id}`}>
                <CardHeader>
                    <CardTitle className="text-2xl">{post.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {post.profiles?.username ? `By ${post.profiles.username} • Created on ${formatDateTime(post.created_at)}` : formatDateTime(post.created_at)}
                        {post.edited_at && ` • Edited ${formatDateTime(post.edited_at)}`}
                    </p>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{excerpt}</p>
                </CardContent>
            </Link>
        </Card>
    );
}