"use client";

import { ApiClient } from "@/lib/api-client";
import type { Manga } from "@/domain/entities/manga";
import type { Chapter } from "@/domain/entities/chapter";
import type { Page } from "@/domain/entities/page";
import { useState, useCallback } from "react";

export interface SearchFilters {
  tags: string[];
  sort: string;
  status: string;
  minChapters: number;
}

export function useSearch() {
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"browse" | "search">("browse");
  const [browseMode, setBrowseMode] = useState<"recent" | "popular">("recent");
  const [filters, setFilters] = useState<SearchFilters>({ tags: [], sort: "date", status: "", minChapters: 0 });

  const handlePagination = (meta: { totalPages?: number; hasMore?: boolean } | undefined, data: Manga[], p: number) => {
    const more = meta?.hasMore ?? data.length >= 20;
    setHasMore(more);
    if (meta?.totalPages != null && meta.totalPages > 1) {
      setTotalPages(meta.totalPages);
    } else if (more) {
      setTotalPages(prev => Math.max(prev, p + 1));
    } else {
      setTotalPages(p);
    }
  };

  const buildFilterParams = useCallback((params: URLSearchParams, currentFilters: SearchFilters) => {
    if (currentFilters.tags.length > 0) {
      params.set("tags", currentFilters.tags.join(","));
    }
    if (currentFilters.sort && currentFilters.sort !== "date") {
      params.set("sort", currentFilters.sort);
    }
    if (currentFilters.status) {
      params.set("status", currentFilters.status);
    }
    if (currentFilters.minChapters > 0) {
      params.set("minChapters", String(currentFilters.minChapters));
    }
  }, []);

  const search = useCallback(async (q: string, providers?: string[], p = 1, currentFilters?: SearchFilters) => {
    setLoading(true);
    setError(null);
    setQuery(q);
    setMode("search");
    setPage(p);
    try {
      const params = new URLSearchParams({ q, page: String(p) });
      if (providers?.length) params.set("providers", providers.join(","));
      if (currentFilters) buildFilterParams(params, currentFilters);
      const { data, meta } = await ApiClient.getWithMeta<Manga[]>(`/api/manga/search?${params}`);
      setResults(data);
      handlePagination(meta, data, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams]);

  const loadLatest = useCallback(async (providerId: string, p = 1, currentFilters?: SearchFilters) => {
    setLoading(true);
    setError(null);
    setQuery("");
    setMode("browse");
    setPage(p);
    try {
      const params = new URLSearchParams({ providerId, page: String(p) });
      if (currentFilters) buildFilterParams(params, currentFilters);
      const { data, meta } = await ApiClient.getWithMeta<Manga[]>(`/api/manga/latest?${params}`);
      setResults(data);
      handlePagination(meta, data, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load manga");
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams]);

  const loadPopular = useCallback(async (providerId: string, p = 1, currentFilters?: SearchFilters) => {
    setLoading(true);
    setError(null);
    setQuery("");
    setMode("browse");
    setPage(p);
    try {
      const params = new URLSearchParams({ providerId, page: String(p) });
      if (currentFilters) buildFilterParams(params, currentFilters);
      const { data, meta } = await ApiClient.getWithMeta<Manga[]>(`/api/manga/popular?${params}`);
      setResults(data);
      handlePagination(meta, data, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load manga");
    } finally {
      setLoading(false);
    }
  }, [buildFilterParams]);

  return { results, loading, error, search, loadLatest, loadPopular, browseMode, setBrowseMode, filters, setFilters, page, totalPages, hasMore, query, mode, setPage };
}

export function useManga() {
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManga = useCallback(async (providerId: string, mangaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [mangaData, chaptersData] = await Promise.all([
        ApiClient.get<Manga>(`/api/manga/${providerId}/${mangaId}`),
        ApiClient.get<Chapter[]>(`/api/manga/${providerId}/${mangaId}/chapters`),
      ]);
      setManga(mangaData);
      setChapters(chaptersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load manga");
    } finally {
      setLoading(false);
    }
  }, []);

  return { manga, chapters, loading, error, fetchManga };
}

export function useReader() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async (providerId: string, chapterId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.get<Page[]>(`/api/manga/pages/${providerId}/${chapterId}`);
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }, []);

  return { pages, loading, error, fetchPages };
}
