import type { ApiResponse, PaginationMeta } from "@/domain/types/api";

const API_BASE = "";

export class ApiClient {
  private static async request<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await res.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Request failed");
    }

    return data.data as T;
  }

  private static async requestWithMeta<T>(
    url: string,
    options?: RequestInit
  ): Promise<{ data: T; meta?: PaginationMeta }> {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const data: ApiResponse<T> = await res.json();

    if (!data.success) {
      throw new Error(data.error?.message || "Request failed");
    }

    return { data: data.data as T, meta: data.meta };
  }

  static async get<T>(url: string): Promise<T> {
    return this.request<T>(url);
  }

  static async getWithMeta<T>(url: string): Promise<{ data: T; meta?: PaginationMeta }> {
    return this.requestWithMeta<T>(url);
  }

  static async post<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async put<T>(url: string, body?: unknown): Promise<T> {
    return this.request<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  static async delete<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: "DELETE" });
  }

  static imageUrl(url: string, headers?: Record<string, string>): string {
    const params = new URLSearchParams({ url });
    if (headers) {
      params.set("headers", JSON.stringify(headers));
    }
    return `/api/image?${params.toString()}`;
  }
}
