import { queryClient } from "./queryClient";

class ApiClient {
  private baseURL: string;
  public defaults: { headers?: Record<string, string> };

  constructor(baseURL = "") {
    this.baseURL = baseURL;
    this.defaults = {};
  }

  async request(method: string, url: string, data?: unknown): Promise<Response> {
    const fullUrl = this.baseURL + url;
    const token = localStorage.getItem("auth-token");
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.defaults.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      credentials: "include",
    };

    if (data && method !== "GET") {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(fullUrl, config);

    // Handle auth errors
    if (response.status === 401) {
      localStorage.removeItem("auth-token");
      queryClient.clear();
      window.location.href = "/auth";
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }
}

export const apiRequest = (method: string, url: string, data?: unknown) => {
  const client = new ApiClient();
  return client.request(method, url, data);
};
