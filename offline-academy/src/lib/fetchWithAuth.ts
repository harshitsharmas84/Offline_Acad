export async function fetchWithAuth(url: string, accessToken: string) {
  let res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (res.status === 401) {
    // Access token expired → refresh
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    const data = await refreshRes.json();
    if (!data.accessToken) throw new Error("Session expired");

    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${data.accessToken}`,
      },
    });
  }

  return res.json();
}
