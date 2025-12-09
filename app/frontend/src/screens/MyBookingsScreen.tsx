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
  Image,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { getAuthToken, getCurrentUser } from "../services/authService";
import {
  fetchMyReservations,
  cancelReservation,
  Reservation,
} from "../services/reservationService";

const formatDateTime = (value?: string | null) => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return "TBD";
  }
  
  try {
    // First, try to parse as a full date-time string
    const date = new Date(value);
    
    // Check if date is valid by checking if getTime() returns a valid number
    if (!isNaN(date.getTime()) && date.toString() !== "Invalid Date") {
      // It's a valid date, format it
      const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const day = date.toLocaleDateString([], {
        month: "long",
        day: "numeric",
        year: "numeric",
        weekday: "long",
      });
      return `${time} — ${day}`;
    }
    
    // If not a valid date, it might be just a time string (e.g., "08:00 AM" or "8:00")
    // Return it as-is
    if (typeof value === "string") {
      return value;
    }
    
    return "TBD";
  } catch (error) {
    // If parsing fails, return the value as-is if it's a string, otherwise "TBD"
    if (typeof value === "string") {
      return value;
    }
    return "TBD";
  }
};

export default function MyBookingsScreen() {
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
        // Try multiple possible fields for departure time
        const timeValue = 
          (shuttle as any).departureTime || 
          (shuttle as any).time || 
          (shuttle as any).departureDate ||
          null;
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

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const user = useMemo(() => getCurrentUser(), []);
  const displayName = useMemo(() => {
    return user?.name?.toUpperCase() || "USER";
  }, [user]);

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
          <Text style={styles.welcomeText}>WELCOME {displayName}!</Text>
          <Text style={styles.dateText}>{todayLabel}</Text>
        </View>

        {loading ? (
          <Text style={styles.statusText}>Loading bookings...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : bookings.length === 0 ? (
          <Text style={styles.statusText}>No bookings found.</Text>
        ) : (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>My Bookings</Text>
            <View style={styles.cardList}>
              {bookings.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.circle}>
                  <Image
                    source={require("../../assets/routereserve-icon.png")}
                    style={styles.circleIcon}
                    resizeMode="contain"
                  />
                </View>
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
                  {booking.isRecurring && (
                    <>
                      <Text style={styles.recurringBadge}>
                        🔄 Recurring ({booking.recurrenceType === "daily" ? "Daily" : "Weekly"})
                      </Text>
                      {booking.scheduledDate && (
                        <Text style={styles.detailText}>
                          Date: {new Date(booking.scheduledDate).toLocaleDateString()}
                        </Text>
                      )}
                      {booking.recurrenceEndDate && (
                        <Text style={styles.detailText}>
                          Until: {new Date(booking.recurrenceEndDate).toLocaleDateString()}
                        </Text>
                      )}
                    </>
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
              ))}
            </View>
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
    gap: 2,
    paddingVertical: 6,
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
    marginTop: 8,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 4,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardList: {
    gap: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
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
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  circleIcon: {
    height: 34,
    width: 34,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  bookingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  detailText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cancelButton: {
    minWidth: 90,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cancelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  detailsButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d4ed8",
  },
});


