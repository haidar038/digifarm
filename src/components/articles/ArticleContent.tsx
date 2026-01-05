interface ArticleContentProps {
    content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
    return (
        <div
            className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:tracking-tight
                prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                prose-p:text-foreground/90 prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground
                prose-img:rounded-lg prose-img:shadow-md
                prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-pre:bg-muted prose-pre:border
                prose-ul:list-disc prose-ol:list-decimal
                prose-li:text-foreground/90"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
