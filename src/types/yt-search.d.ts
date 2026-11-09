declare module 'yt-search' {
  interface VideoSearchResult {
    type: 'video';
    videoId: string;
    url: string;
    title: string;
    description: string;
    image: string;
    thumbnail: string;
    seconds: number;
    timestamp: string;
    duration: {
      toString(): string;
      seconds: number;
      timestamp: string;
    };
    ago: string;
    views: number;
    author: {
      name: string;
      url: string;
    };
  }

  interface SearchResult {
    all: unknown[];
    videos: VideoSearchResult[];
    playlists: unknown[];
    accounts: unknown[];
  }

  function ytSearch(
    query: string | { query: string; page?: number },
    fn?: (err: Error | null, r: SearchResult) => void
  ): Promise<SearchResult>;

  export default ytSearch;
}
