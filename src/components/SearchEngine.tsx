
'use client';

import React, { useState, useEffect } from 'react';
import { useSearch } from '@/hooks/useSearch'; // Wait, I need to check where I put useSearch. I put it in hooks/useSearch.ts
import { ArticleCard } from './ArticleCard'; // same folder?
import { Search, Loader2 } from 'lucide-react';

export default function SearchEngine() { // Default export for simplicity in page.tsx
    const [query, setQuery] = useState('');
    const { search, loading, index } = useSearch(); // Actually useSearch returns { search, index, loading }? I need to verify useSearch definition.
    // In Step 130 I defined: export function useSearch() { ... return { search: (query) => ..., index, loading }; }
    // Wait, I didn't export 'search' function directly as search(query). I exported a function that RETURNS the results?
    // Let's re-read Step 130.
    // const search = (query: string) => { ... return fuse.search(query)... }
    // return { search, index, loading };
    // So `search` is a function that takes a query and returns items. Correct.

    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        if (!loading) {
            if (query.trim() === '') {
                setResults(index);
            } else {
                const hits = search(query);
                // fuse returns { item, refIndex } usually, but my implementation mapped it to result.item?
                // Let's check Step 130: return fuse.search(query).map((result) => result.item);
                // Yes, so it returns SearchIndexItem[].
                setResults(hits);
            }
        }
    }, [query, loading, index]);

    return (
        <div className="space-y-8">
            {/* Search Input */}
            <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search articles by keyword, tag, or content..."
                    className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all shadow-xl backdrop-blur-md"
                />
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-amber-500">
                        <Loader2 size={20} className="animate-spin" />
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="text-center text-zinc-500 text-sm">
                Found {results.length} articles
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((article) => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                        onTagClick={(tag) => setQuery(tag)}
                    />
                ))}
            </div>

            {results.length === 0 && !loading && (
                <div className="text-center py-20">
                    <p className="text-zinc-500 text-lg">No articles found matching &quot;{query}&quot;</p>
                </div>
            )}
        </div>
    );
}
