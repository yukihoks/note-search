
'use client';

import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { SearchIndexItem } from '@/types';

const FUSE_OPTIONS = {
    keys: [
        { name: 'title', weight: 0.7 },
        { name: 'tags', weight: 0.2 },
        { name: 'content', weight: 0.1 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
};

export function useSearch() {
    const [index, setIndex] = useState<SearchIndexItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/search-index.json')
            .then((res) => res.json())
            .then((data) => {
                setIndex(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load search index', err);
                setLoading(false);
            });
    }, []);

    const fuse = useMemo(() => new Fuse(index, FUSE_OPTIONS), [index]);

    const search = (query: string) => {
        if (!query) return index;
        return fuse.search(query).map((result) => result.item);
    };

    return { search, index, loading };
}
