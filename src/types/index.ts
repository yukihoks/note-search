
export interface SearchIndexItem {
    id: number;
    title: string;
    slug: string;
    content: string; // Full text or snippet
    tags: string[];
    thumbnail: string;
    publishedAt: string;
    url: string;
}
