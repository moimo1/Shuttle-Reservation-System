const API_BASE_URL = __DEV__
  ? "http://192.168.1.2:5000/api"
  : "http://localhost:5000/api";

export type Notification = {
  _id: string;
  user: string;
  reservation: {
    _id: string;
    seatNumber: number;
    destination: string;
    trip?: {
      _id: string;
      departureTime: string;
      route?: string;
      direction?: "forward" | "reverse";
    };
  };
  shuttle: {
    _id: string;
    name: string;
  };
  type: "reminder" | "confirmation" | "cancellation";
  title: string;
  message: string;
  scheduledFor?: string;
  isSent: boolean;
  sentAt?: string;
  isRead: boolean;
  createdAt: string;
};

export const fetchNotifications = async (token?: string | null): Promise<Notification[]> => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load notifications");
  }

  return data;
};

export const markNotificationAsRead = async (
  notificationId: string,
  token?: string | null
): Promise<Notification> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to mark notification as read");
  }

  return data.notification;
};

export const getUnreadCount = async (token?: string | null): Promise<number> => {
  try {
    const notifications = await fetchNotifications(token);
    return notifications.filter((n) => !n.isRead).length;
  } catch {
    return 0;
  }
};

