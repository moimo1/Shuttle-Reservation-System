import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { fetchDriverReservations, DriverReservation } from "../services/driverService";
import { getAuthToken, getCurrentUser } from "../services/authService";

type DriverTrip = {
  key: string;
  status: "ongoing" | "upcoming" | "completed";
  time: string;
  route: string;
  passengers: DriverReservation[];
  capacity: number;
  remainingStops?: number;
  eta?: string;
  dateLabel?: string;
};

export default function DriverReservationsScreen() {
  const [reservations, setReservations] = useState<DriverReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<DriverTrip | null>(null);
  const [activeModal, setActiveModal] = useState<"details" | "passengers" | "notification" | null>(
    null
  );
  const [destinationFilter, setDestinationFilter] = useState("");
  const [presence, setPresence] = useState<Record<string, "present" | "absent">>({});
  const displayName = useMemo(() => {
    const user = getCurrentUser();
    const name = user?.name || "Driver";
    return name.toUpperCase();
  }, []);

  const todayLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const parseDepartureToDate = (time: string | undefined) => {
    if (!time) return null;
    const match = time.trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)$/i);
    if (!match) return null;
    const [, hourRaw, minuteRaw, meridiem] = match;
    let hour = Number(hourRaw);
    const minutes = Number(minuteRaw ?? "0");
    if (Number.isNaN(hour) || Number.isNaN(minutes)) return null;
    if (meridiem?.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
    const date = new Date();
    date.setHours(hour, minutes, 0, 0);
    return date;
  };

  const determineTripStatus = (time: string | undefined): DriverTrip["status"] => {
    const departure = parseDepartureToDate(time);
    if (!departure) return "ongoing";
    const diffMins = (departure.getTime() - Date.now()) / (1000 * 60);
    if (diffMins > 30) return "upcoming";
    if (diffMins < -30) return "completed";
    return "ongoing";
  };

  const normalizedTrips = useMemo<DriverTrip[]>(() => {
    const grouped: Record<string, DriverTrip> = {};

    const filteredReservations = reservations.filter((res) => {
      if (!destinationFilter.trim()) return true;
      return res.destination?.toLowerCase().includes(destinationFilter.trim().toLowerCase());
    });

    filteredReservations.forEach((res) => {
      const key = `${res.shuttleName || "Trip"}-${res.departureTime || "time"}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          status: determineTripStatus(res.departureTime),
          time: res.departureTime || "TBD",
          route: res.shuttleName || "Route",
          passengers: [],
          capacity: 20,
          remainingStops: 3,
          eta: "Ready to depart",
          dateLabel: "Today",
        };
      }
      grouped[key].passengers.push(res);
    });

    return Object.values(grouped)
      .map((trip) => ({
        ...trip,
        passengers: [...trip.passengers].sort((a, b) =>
          (a.destination || "").localeCompare(b.destination || "")
        ),
      }))
      .filter((trip) => {
        if (!destinationFilter.trim()) return true;
        return trip.passengers.some((p) =>
          p.destination.toLowerCase().includes(destinationFilter.trim().toLowerCase())
        );
      });
  }, [reservations, destinationFilter]);

  const nearestDropOff = useMemo(() => {
    const ongoing = normalizedTrips.find((t) => t.status === "ongoing");
    if (!ongoing) return "";
    const destinations = ongoing.passengers.map((p) => p.destination).filter(Boolean);
    if (!destinations.length) return "";
    return destinations.sort((a, b) => a.localeCompare(b))[0];
  }, [normalizedTrips]);

  const loadReservations = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("You must be logged in as a driver to view reservations.");
      }
      const data = await fetchDriverReservations(token);
      setReservations(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleOpenModal = (type: "details" | "passengers" | "notification", trip?: DriverTrip) => {
    if (trip) setSelectedTrip(trip);
    setActiveModal(type);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedTrip(null);
  };

  const handleStartTrip = () => {
    Alert.alert("Trip started", "Trip start recorded (local only).");
  };

  const handleEndTrip = () => {
    Alert.alert("Trip ended", "Trip end recorded (local only).");
  };

  const togglePresence = (passengerKey: string, status: "present" | "absent") => {
    setPresence((prev) => ({
      ...prev,
      [passengerKey]: status,
    }));
  };

  const renderTripCard = (trip: DriverTrip) => {
    const passengerCount = trip.passengers.length;
    const capacity = trip.capacity || 20;
    const title =
      trip.status === "ongoing"
        ? "ONGOING"
        : trip.status === "upcoming"
        ? "UPCOMING"
        : "COMPLETED";

    return (
      <TouchableOpacity
        key={trip.key}
        style={[
          styles.tripCard,
          trip.status === "ongoing"
            ? styles.cardOngoing
            : trip.status === "upcoming"
            ? styles.cardUpcoming
            : styles.cardCompleted,
        ]}
        onPress={() => handleOpenModal("details", trip)}
        activeOpacity={0.92}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{title}</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{trip.time}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <Text style={styles.detailText}>{trip.route}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Passengers</Text>
          <Text style={styles.metaValue}>
            {passengerCount} / {capacity}
          </Text>
        </View>
        {trip.status !== "completed" ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>ETA</Text>
            <Text style={styles.metaValue}>
              {trip.eta || "Ready"}
              {trip.remainingStops ? ` • ${trip.remainingStops} stops` : ""}
            </Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{trip.dateLabel || "Today"}</Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenModal("details", trip)}
          >
            <Text style={styles.linkText}>View Details</Text>
          </TouchableOpacity>
          {trip.status === "ongoing" && (
            <TouchableOpacity
              style={[styles.linkButton, styles.linkEmphasis]}
              onPress={() => handleOpenModal("passengers", trip)}
            >
              <Text style={[styles.linkText, styles.linkEmphasisText]}>Passenger List</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPassengerGrid = (trip: DriverTrip) => {
    const capacity = trip.capacity || 20;
    const seats = Array.from({ length: capacity }, (_, idx) => idx + 1);
    return seats.map((seat) => {
      const passenger = trip.passengers.find((p) => p.seatNumber === seat);
      const key = passenger ? `${passenger.email}-${seat}` : `seat-${seat}`;
      const status = passenger ? presence[key] || "present" : "available";

      return (
        <View key={key} style={styles.seatCard}>
          <Text style={styles.seatLabel}>Seat {seat}</Text>
          {passenger ? (
            <>
              <Text style={styles.passengerName}>{passenger.name}</Text>
              <Text style={styles.passengerDest}>{passenger.destination}</Text>
              <View style={styles.presencePills}>
                <TouchableOpacity
                  style={[
                    styles.presencePill,
                    status === "present" ? styles.present : styles.pillNeutral,
                  ]}
                  onPress={() => togglePresence(key, "present")}
                >
                  <Text
                    style={[
                      styles.presenceText,
                      status === "present" ? styles.presentText : styles.pillText,
                    ]}
                  >
                    Present
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.presencePill,
                    status === "absent" ? styles.absent : styles.pillNeutral,
                  ]}
                  onPress={() => togglePresence(key, "absent")}
                >
                  <Text
                    style={[
                      styles.presenceText,
                      status === "absent" ? styles.absentText : styles.pillText,
                    ]}
                  >
                    Absent
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.availableText}>Available</Text>
          )}
        </View>
      );
    });
  };

  const showEmpty =
    !loading && !error && !normalizedTrips.length ? "No reservations match your filters." : "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerEdgeToEdge}>
          <AppHeader />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>WELCOME {displayName}!</Text>
          <Text style={styles.dateText}>{todayLabel}</Text>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterLabel}>Destination filter</Text>
            {nearestDropOff ? (
              <Text style={styles.nearestText}>Nearest drop-off: {nearestDropOff}</Text>
            ) : null}
          </View>
          <TextInput
            placeholder="Search destination (e.g. Main Campus)"
            placeholderTextColor="#666"
            value={destinationFilter}
            onChangeText={setDestinationFilter}
            style={styles.filterInput}
          />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={loadReservations}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>{loading ? "Refreshing..." : "Refresh"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryGhostButton}
              onPress={() => setDestinationFilter("")}
            >
              <Text style={styles.secondaryGhostText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notificationCard}>
          <Text style={styles.notifTitle}>⚠️ Trip Notifications</Text>
          <Text style={styles.notifText}>
            Passenger cancellations will appear here with seat, time, and destination.
          </Text>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => normalizedTrips[0] && handleOpenModal("notification", normalizedTrips[0])}
            disabled={!normalizedTrips.length}
          >
            <Text style={styles.outlineText}>View latest notification</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.statusText}>{error}</Text> : null}
        {!error && loading ? <Text style={styles.statusText}>Loading reservations...</Text> : null}
        {showEmpty ? <Text style={styles.statusText}>{showEmpty}</Text> : null}

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Ongoing Trip</Text>
          <View style={styles.cardList}>
            {normalizedTrips
              .filter((t) => t.status === "ongoing")
              .map((trip) => renderTripCard(trip))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Upcoming Trips</Text>
          <View style={styles.cardList}>
            {normalizedTrips
              .filter((t) => t.status === "upcoming")
              .map((trip) => renderTripCard(trip))}
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Completed Trips</Text>
          <View style={styles.cardList}>
            {normalizedTrips
              .filter((t) => t.status === "completed")
              .map((trip) => renderTripCard(trip))}
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={!!activeModal && activeModal !== "notification"}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === "passengers" ? "Passenger List" : "Trip Details"}
              </Text>
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {selectedTrip && activeModal === "details" ? (
              <>
                <Text style={styles.detailText}>Date: {selectedTrip.dateLabel || "Today"}</Text>
                <Text style={styles.detailText}>Time: {selectedTrip.time}</Text>
                <Text style={styles.detailText}>Route: {selectedTrip.route}</Text>
                <Text style={styles.detailText}>
                  Booked Passengers: {selectedTrip.passengers.length} / {selectedTrip.capacity}
                </Text>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleOpenModal("passengers", selectedTrip)}
                  >
                    <Text style={styles.secondaryText}>View List of Passengers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleEndTrip}>
                    <Text style={styles.primaryButtonText}>End Trip</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {selectedTrip && activeModal === "passengers" ? (
              <>
                <ScrollView 
                  style={styles.passengerScrollContainer}
                  contentContainerStyle={styles.passengerGrid}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {renderPassengerGrid(selectedTrip)}
                </ScrollView>
                <TouchableOpacity style={styles.primaryButton} onPress={handleStartTrip}>
                  <Text style={styles.primaryButtonText}>Start Trip</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={activeModal === "notification"}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.notifTitle}>Passenger Cancellation Received</Text>
            <Text style={styles.detailText}>Passenger: Anne Villamor</Text>
            <Text style={styles.detailText}>Seat: 10</Text>
            <Text style={styles.detailText}>Cancelled: 8:42 AM</Text>
            <Text style={styles.detailText}>Destination: Bakakeng</Text>
            <Text style={[styles.detailText, styles.subtleText]}>Reason: No reason provided</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleCloseModal}>
              <Text style={styles.primaryButtonText}>Acknowledge Cancellation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cdd4ff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef1ff",
    paddingHorizontal: 8,
  },
  secondaryText: {
    color: "#0f1e6b",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryGhostButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  secondaryGhostText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
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
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  cardOngoing: {
    borderColor: "#1b7a2f",
  },
  cardUpcoming: {
    borderColor: "#d0a116",
  },
  cardCompleted: {
    borderColor: "#7c5c5c",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#1d4ed8",
    borderRadius: 8,
  },
  statusPillText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  timePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#eef1ff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cdd4ff",
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  timeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  detailText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  subtleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  routeRow: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  linkEmphasis: {
    backgroundColor: "#0f1e6b",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  linkEmphasisText: {
    color: "#fff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0a0a",
    letterSpacing: 0.2,
  },
  closeButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  closeText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginTop: -2,
  },
  passengerScrollContainer: {
    maxHeight: 400,
    marginTop: 8,
  },
  passengerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 8,
  },
  seatCard: {
    width: "48%",
    backgroundColor: "#f8f9ff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dfe4ff",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  seatLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f1e6b",
  },
  passengerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  passengerDest: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  availableText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f7d2a",
  },
  presencePills: {
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  presencePill: {
    borderWidth: 1,
    borderColor: "#c4c4c4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presenceText: {
    fontSize: 12,
    fontWeight: "800",
  },
  pillNeutral: {
    borderColor: "#c4c4c4",
  },
  pillText: {
    color: "#000",
  },
  present: {
    borderColor: "#0c8b2f",
    backgroundColor: "#e6f5eb",
  },
  presentText: {
    color: "#0c8b2f",
  },
  absent: {
    borderColor: "#c62828",
    backgroundColor: "#fde8e8",
  },
  absentText: {
    color: "#c62828",
  },
  filterCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e6ff",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
  },
  nearestText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f7d2a",
  },
  filterInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    fontSize: 13,
    fontWeight: "700",
  },
  notificationCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ffd7b5",
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#b45309",
  },
  notifText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7a5008",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#b45309",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  outlineText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#b45309",
  },
});
