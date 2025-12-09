import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import AppHeader from "../components/AppHeader";
import { getAuthToken } from "../services/authService";
import {
  fetchMyReservations,
  cancelReservation,
  Reservation,
} from "../services/reservationService";

const formatDateTime = (value?: string) => {
  if (!value) return "TBD";
  try {
    const date = new Date(value);
    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const day = date.toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
      weekday: "long",
    });
    return `${time} — ${day}`;
  } catch {
    return value;
  }
};

export default function MyBookingsScreen() {
  const navigation = useNavigation<any>();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    try {
      setError("");
      const token = getAuthToken();
      if (!token) {
        setError("Please login to view your bookings.");
        setReservations([]);
        return;
      }
      const data = await fetchMyReservations(token);
      setReservations(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleCancel = async (reservationId: string) => {
    Alert.alert(
      "Cancel Reservation",
      "Are you sure you want to cancel this reservation?",
      [
        { text: "No" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              setActionId(reservationId);
              const token = getAuthToken();
              await cancelReservation(reservationId, token);
              await loadReservations();
            } catch (err: any) {
              Alert.alert("Cancel Failed", err?.message || "Could not cancel reservation");
            } finally {
              setActionId(null);
            }
          },
        },
      ]
    );
  };

  const statusColor = (status?: string) =>
    status === "active" || status === "confirmed" ? "#0c8b2f" : "#c62828";

  const bookings = useMemo(
    () =>
      reservations.map((r, idx) => {
        const shuttle = r.shuttle || {};
        const timeValue = (shuttle as any).departureTime || (shuttle as any).time;
        return {
          id: r._id || String(idx),
          title: `Booking #${idx + 1}`,
          status: r.status || "active",
          time: timeValue,
          route:
            ((shuttle as any).destination ||
              (shuttle as any).name ||
              r.destination ||
              "Route not set")
              .replace(/->/g, "→")
              .replace(/\s*->\s*/g, " → "),
          shuttleNumber:
            (shuttle as any).shuttleNumber || (shuttle as any).name || "Shuttle",
          createdAt: r.createdAt,
          seatNumber: r.seatNumber,
        };
      }),
    [reservations]
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadReservations();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerEdgeToEdge}>
          <AppHeader />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>WELCOME @USER!</Text>
          <Text style={styles.dateText}>TODAY IS JANUARY 14, 2025(TUESDAY)</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.inactiveTab]}
            onPress={() => navigation.navigate("MainTabs", { screen: "Schedule" })}
          >
            <Text style={styles.actionText}>VIEW SCHEDULE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.activeTab]}>
            <Text style={styles.actionText}>MY BOOKINGS</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.statusText}>Loading bookings...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : bookings.length === 0 ? (
          <Text style={styles.statusText}>No bookings found.</Text>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.circle} />
                <View style={styles.cardBody}>
                  <Text style={styles.bookingTitle}>{booking.title}</Text>
                  <Text style={[styles.statusLabel, { color: statusColor(booking.status) }]}>
                    Status: {booking.status === "active" ? "Confirmed" : "Cancelled"}
                  </Text>
                  <Text style={styles.detailText}>
                    Time: {formatDateTime(booking.time)}
                  </Text>
                  <Text style={styles.detailText}>Route: {booking.route}</Text>
                  <Text style={styles.detailText}>
                    Shuttle Number: {booking.shuttleNumber}
                  </Text>
                  {!!booking.seatNumber && (
                    <Text style={styles.detailText}>Seat: {booking.seatNumber}</Text>
                  )}
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => handleCancel(booking.id)}
                  disabled={booking.status !== "active" || actionId === booking.id}
                >
                  <Text style={styles.cancelText}>
                    {booking.status !== "active"
                      ? "Cancelled"
                      : actionId === booking.id
                      ? "Cancelling..."
                      : "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => Alert.alert("Booking Details", "Coming soon")}
                >
                  <Text style={styles.detailsText}>VIEW DETAILS</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 32,
    gap: 12,
  },
  headerEdgeToEdge: {
    marginHorizontal: -16,
  },
  welcomeWrap: {
    gap: 2,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 4,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  activeTab: {
    backgroundColor: "#eaeaea",
    borderColor: "#444",
  },
  inactiveTab: {
    backgroundColor: "#f8f8f8",
    borderColor: "#999",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    padding: 16,
    gap: 14,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  circle: {
    height: 52,
    width: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#7d7d7d",
    backgroundColor: "#fff",
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  detailText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelButton: {
    minWidth: 90,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
  },
  cancelText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
  },
});


