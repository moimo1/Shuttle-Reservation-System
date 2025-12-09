import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { getAuthToken } from "../services/authService";
import {
  fetchNotifications,
  markNotificationAsRead,
  Notification,
} from "../services/notificationService";

const formatDateTime = (value?: string) => {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return value;
  }
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "confirmation":
      return "checkmark-circle";
    case "cancellation":
      return "close-circle";
    case "reminder":
      return "time";
    default:
      return "notifications";
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "confirmation":
      return "#0c8b2f";
    case "cancellation":
      return "#c62828";
    case "reminder":
      return "#4A90E2";
    default:
      return "#6b7280";
  }
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setError("");
      const token = getAuthToken();
      if (!token) {
        setError("Please login to view notifications.");
        setNotifications([]);
        return;
      }
      const data = await fetchNotifications(token);
      setNotifications(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = getAuthToken();
      await markNotificationAsRead(notificationId, token);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to mark notification as read");
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    // Navigate to relevant screen based on notification type
    if (notification.reservation) {
      // Could navigate to booking details
      Alert.alert(notification.title, notification.message);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerEdgeToEdge}>
          <AppHeader subtitle="Notifications" unreadCount={unreadCount} />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>NOTIFICATIONS</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadText}>{unreadCount} unread</Text>
          )}
        </View>

        {loading ? (
          <Text style={styles.statusText}>Loading notifications...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubtext}>You'll see updates about your bookings here</Text>
          </View>
        ) : (
          <View style={styles.sectionBlock}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification._id}
                style={[
                  styles.card,
                  !notification.isRead && styles.cardUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${getNotificationColor(notification.type)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{notification.title}</Text>
                      {!notification.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.cardMessage}>{notification.message}</Text>
                    {notification.shuttle && (
                      <Text style={styles.cardDetail}>
                        Shuttle: {notification.shuttle.name} • {notification.shuttle.departureTime}
                      </Text>
                    )}
                    <Text style={styles.cardTime}>
                      {formatDateTime(notification.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f8fb",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
    gap: 16,
  },
  headerEdgeToEdge: {
    marginHorizontal: -16,
  },
  welcomeWrap: {
    gap: 4,
    paddingVertical: 6,
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  unreadText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A90E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9ca3af",
    textAlign: "center",
  },
  sectionBlock: {
    gap: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  cardUnread: {
    borderColor: "#4A90E2",
    borderWidth: 2,
    backgroundColor: "#F0F7FF",
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  iconCircle: {
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },
  unreadDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#4A90E2",
  },
  cardMessage: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    lineHeight: 18,
  },
  cardDetail: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 2,
  },
  cardTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 4,
  },
});

