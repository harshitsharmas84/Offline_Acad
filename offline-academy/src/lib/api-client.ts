export let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
    accessToken = token;
};

export const getAccessToken = () => accessToken;

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    // 1. Attach current Access Token
    let headers: HeadersInit = { ...options.headers };
    if (accessToken) {
        headers = { ...headers, Authorization: `Bearer ${accessToken}` };
    }

    let response = await fetch(url, { ...options, headers });

    // 2. If 401 (Expired), try to Refresh
    if (response.status === 401) {
        try {
            const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
            const data = await refreshRes.json();

            if (data.success) {
                // 3. Update Token and Retry Original Request
                setAccessToken(data.accessToken);
                headers = { ...options.headers, Authorization: `Bearer ${data.accessToken}` };
                response = await fetch(url, { ...options, headers });
            } else {
                // Refresh failed (Session expired), force logout
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
        } catch (_error) {
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
    }

    return response;
}
