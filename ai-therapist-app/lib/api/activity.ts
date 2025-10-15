interface ActivityEntry {
  type: string;
  name: string;
  description?: string;
  duration?: number;
}

export const API_BASE =
  process.env.BACKEND_API_URL ||
  "http://localhost:3001";

export async function logActivity(
  data: ActivityEntry
): Promise<{ success: boolean; data: any }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/activity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to log activity");
  }

  return response.json();
}

export async function fetchTodayActivities(): Promise<{ success: boolean; data: any[] }> {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE}/api/activity/today`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch activities");
  }

  return response.json();
}
