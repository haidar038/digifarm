import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ForumThread } from "@/types/forum";
import { formatForumDate, getThreadStatusBadge, truncateContent } from "@/lib/forum-utils";
import { MessageSquare, Eye, Pin, CheckCircle } from "lucide-react";
import { ExpertBadge } from "./ExpertBadge";

interface ThreadCardProps {
    thread: ForumThread;
    showCategory?: boolean;
}

export function ThreadCard({ thread, showCategory = true }: ThreadCardProps) {
    const statusBadge = getThreadStatusBadge(thread.is_solved);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Link to={`/forum/thread/${thread.slug}`}>
            <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30 group">
                <CardContent className="p-4 md:p-5">
                    <div className="flex gap-4">
                        {/* Author Avatar */}
                        <div className="hidden sm:block shrink-0">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm">{thread.author?.full_name ? getInitials(thread.author.full_name) : "?"}</AvatarFallback>
                            </Avatar>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Title */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                {thread.is_pinned && <Pin className="w-4 h-4 text-amber-500 shrink-0" />}
                                <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">{thread.title}</h3>
                            </div>

                            {/* Excerpt */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{truncateContent(thread.content, 150)}</p>

                            {/* Meta */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                {/* Author */}
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-foreground">{thread.author?.full_name || "Anonim"}</span>
                                    {thread.author?.role === "expert" && <ExpertBadge showIcon={false} className="text-[10px] py-0 px-1.5 h-4" />}
                                </div>
                                <span>•</span>
                                <span>{formatForumDate(thread.created_at)}</span>

                                {showCategory && thread.category && (
                                    <>
                                        <span>•</span>
                                        <Badge variant="outline" className="text-[10px] h-5">
                                            {thread.category.name}
                                        </Badge>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                            <Badge className={statusBadge.className + " text-[10px]"}>
                                {thread.is_solved && <CheckCircle className="w-3 h-3 mr-1" />}
                                {statusBadge.text}
                            </Badge>

                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>{thread.reply_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{thread.view_count}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Stats */}
                    <div className="flex md:hidden items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <Badge className={statusBadge.className + " text-[10px]"}>
                            {thread.is_solved && <CheckCircle className="w-3 h-3 mr-1" />}
                            {statusBadge.text}
                        </Badge>
                        <div className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{thread.reply_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{thread.view_count}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
