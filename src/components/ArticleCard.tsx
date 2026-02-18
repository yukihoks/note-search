
import React from 'react';
import { SearchIndexItem } from '@/types';
import { ExternalLink, Calendar, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ArticleCardProps {
    article: SearchIndexItem;
}

export function ArticleCard({ article, onTagClick }: ArticleCardProps & { onTagClick?: (tag: string) => void }) {
    const date = new Date(article.publishedAt);
    const formattedDate = format(date, 'yyyy年MM月dd日', { locale: ja });

    return (
        <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]">
            <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 z-0"
                aria-label={`Read ${article.title}`}
            />

            {article.thumbnail && (
                <div className="aspect-video w-full overflow-hidden relative pointer-events-none">
                    <img
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                </div>
            )}

            <div className="p-5 space-y-3 relative z-10 pointer-events-none">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Calendar size={14} />
                    <time dateTime={article.publishedAt}>{formattedDate}</time>
                </div>

                <h3 className="text-xl font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                    {article.title}
                </h3>

                <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                    {article.content.slice(0, 150)}...
                </p>

                <div className="flex flex-wrap gap-2 pt-2 pointer-events-auto">
                    {article.tags.map(tag => (
                        <button
                            key={tag}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onTagClick?.(tag);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer"
                        >
                            <Hash size={10} />
                            {tag}
                        </button>
                    ))}
                </div>

                <div className="pt-2 flex items-center text-sm font-medium text-amber-400 opacity-0 transform translate-y-2 transition-all group-hover:opacity-100 group-hover:translate-y-0">
                    Read Article <ExternalLink size={14} className="ml-1" />
                </div>
            </div>
        </div>
    );
}
