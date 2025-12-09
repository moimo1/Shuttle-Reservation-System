import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getUnreadCount } from "../services/notificationService";
import { getAuthToken } from "../services/authService";

type Props = {
  onNotifPress?: () => void;
  unreadCount?: number;
  subtitle?: string;
  autoFetchUnread?: boolean;
};

export default function AppHeader({ onNotifPress, unreadCount: propUnreadCount, subtitle, autoFetchUnread = true }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [unreadCount, setUnreadCount] = useState(propUnreadCount ?? 0);

  const fetchUnread = React.useCallback(async () => {
    if (!autoFetchUnread) {
      setUnreadCount(propUnreadCount ?? 0);
      return;
    }
    try {
      const token = getAuthToken();
      if (token) {
        const count = await getUnreadCount(token);
        setUnreadCount(count);
      }
    } catch (err) {
      // Silently fail - use prop value or 0
      setUnreadCount(propUnreadCount ?? 0);
    }
  }, [autoFetchUnread, propUnreadCount]);

  useEffect(() => {
    fetchUnread();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (autoFetchUnread) {
        fetchUnread();
      }
    }, [fetchUnread, autoFetchUnread])
  );

  const handleNotificationPress = () => {
    if (onNotifPress) {
      onNotifPress();
    } else {
      // Default: navigate to notifications screen
      (navigation as any).navigate("Notifications");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.accentBubble} />
      <View style={styles.accentBubbleSmall} />

      <View style={styles.row}>
        <View style={styles.brandPill}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/routereserve-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.titleStack}>
            <Text style={styles.appName}>Routereserve</Text>
            <Text style={styles.tagline}>{subtitle || "Your seat, your route"}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleNotificationPress}
          activeOpacity={0.85}
          style={styles.iconButton}
        >
          <Ionicons name="notifications-outline" size={22} color="#0f2553" />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Live shuttle updates enabled</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#1142a4",
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  accentBubble: {
    position: "absolute",
    top: -40,
    right: -20,
    height: 140,
    width: 140,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 80,
  },
  accentBubbleSmall: {
    position: "absolute",
    bottom: -26,
    left: -18,
    height: 86,
    width: 86,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 60,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
  },
  logoCircle: {
    height: 46,
    width: 46,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  logo: {
    height: 36,
    width: 36,
  },
  titleStack: {
    flex: 1,
  },
  appName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  tagline: {
    color: "#d9e3ff",
    fontSize: 12,
    fontWeight: "700",
  },
  iconButton: {
    height: 46,
    width: 46,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "#ff4d6d",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  statusDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#48e08f",
    shadowColor: "#48e08f",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  statusText: {
    color: "#e9f0ff",
    fontSize: 12,
    fontWeight: "700",
  },
});