import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { fetchShuttles, reserveSeat } from "../services/shuttleService";
import { getAuthToken, getCurrentUser } from "../services/authService";
import { fetchMyReservations } from "../services/reservationService";

export default function ViewScheduleScreen() {
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reserveMessage, setReserveMessage] = useState("");
  const [reserving, setReserving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchShuttles();
        console.log("Fetched trips data:", data);
        console.log("Number of trips:", data?.length);
        if (Array.isArray(data)) {
          setShuttles(data);
        } else {
          console.error("Expected array but got:", typeof data, data);
          setError("Invalid data format received");
        }
      } catch (err) {
        console.error("Error loading trips:", err);
        setError(err?.message || "Failed to load schedules");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trips = useMemo(() => {
    if (!Array.isArray(shuttles) || shuttles.length === 0) {
      console.log("No shuttles/trips data available, shuttles:", shuttles);
      return [];
    }
    
    return shuttles.map((trip, idx) => {
      const shuttleName = trip.shuttleName || "Shuttle";
      const direction = trip.direction === "reverse" ? " (Reverse)" : "";
      const departureTime = trip.departureTime;
      
      if (!departureTime) {
        console.warn(`Trip ${trip._id} is missing departureTime:`, trip);
      }
      
      return {
        id: trip._id || String(idx),
        shuttleId: trip._id,
        tripId: trip._id,
        title: `${shuttleName} - Trip ${idx + 1}${direction}`,
        time: departureTime || "TBD",
        route: trip.destination || "Route not set",
        seats: `${trip.seatsAvailable ?? 0} seats left`,
        seatsAvailable: trip.seatsAvailable ?? 0,
        takenSeats: trip.takenSeats || [],
        shuttleName: shuttleName,
        driverName: trip.driverName || null,
      };
    });
  }, [shuttles]);

  const filteredTrips = useMemo(() => {
    if (!searchQuery.trim()) return trips;
    const query = searchQuery.toLowerCase().trim();
    return trips.filter((trip) => 
      trip.time?.toLowerCase().includes(query) ||
      trip.title?.toLowerCase().includes(query) ||
      trip.shuttleName?.toLowerCase().includes(query) ||
      trip.route?.toLowerCase().includes(query)
    );
  }, [trips, searchQuery]);

  const seatMap = useMemo(() => {
    if (!selectedTrip) return [];
    const totalSeats = 20;
    const takenSet = new Set(selectedTrip.takenSeats || []);
    return Array.from({ length: totalSeats }, (_, i) => {
      const num = i + 1;
      return {
        number: num,
        available: !takenSet.has(num),
      };
    });
  }, [selectedTrip]);

  const seatRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 5; i++) {
      rows.push(seatMap.slice(i * 4, i * 4 + 4));
    }
    return rows;
  }, [seatMap]);

  const handleTripPress = (trip) => {
    setSelectedTrip(trip);
    setSelectedSeat(null);
    setReserveMessage("");
    setModalVisible(true);
  };

  const handleClose = async () => {
    setModalVisible(false);
    setSelectedTrip(null);
    setSelectedSeat(null);
    setReserveMessage("");
    setConfirmVisible(false);
    try {
      const data = await fetchShuttles();
      setShuttles(data);
    } catch (err) {
      console.error("Failed to refresh shuttles:", err);
    }
  };

  const handleReservePress = async () => {
    if (!selectedTrip) return;
    if (!selectedSeat) {
      setReserveMessage("Please select a seat.");
      return;
    }
    setReserveMessage("");

    try {
      const token = getAuthToken();
      if (token) {
        const myReservations = await fetchMyReservations(token);
        const activeReservations = myReservations.filter((r) => r.status === "active");
        
        const conflictingReservation = activeReservations.find((reservation) => {
          const trip = reservation.trip;
          if (!trip || !trip.departureTime) return false;
          return trip.departureTime === selectedTrip.time;
        });

        if (conflictingReservation) {
          const conflictingTrip = conflictingReservation.trip;
          const conflictingShuttle = conflictingReservation.shuttle;
          Alert.alert(
            "Time Conflict",
            `You already have a reservation at ${selectedTrip.time} for ${conflictingShuttle?.name || "another trip"}. Please cancel it first or choose a different time.`,
            [{ text: "OK" }]
          );
          return;
        }
      }
    } catch (err) {
      console.log("Could not check for conflicts:", err);
    }

    setConfirmVisible(true);
  };

  const handleReserve = async () => {
    if (!selectedTrip || !selectedSeat) return;
    try {
      setReserving(true);
      setReserveMessage("");
      const token = getAuthToken();
      await reserveSeat(
        selectedTrip.tripId || selectedTrip.shuttleId || selectedTrip.id,
        selectedSeat,
        selectedTrip.route || "Destination",
        token
      );
      setReserveMessage("Seat reserved!");
      setConfirmVisible(false);
      setModalVisible(false);
      setSelectedTrip(null);
      setSelectedSeat(null);
      const data = await fetchShuttles();
      setShuttles(data);
      const updated = data.find((t) => t._id === selectedTrip.tripId || t._id === selectedTrip.shuttleId);
      if (updated) {
        setSelectedTrip((prev) =>
          prev
            ? {
                ...prev,
                seatsAvailable: updated.seatsAvailable,
                takenSeats: updated.takenSeats || [],
                seats: `${updated.seatsAvailable ?? 0} seats left`,
              }
            : prev
        );
      }
    } catch (err) {
      const message = err?.message || "Reservation failed";
      setReserveMessage(message);
      Alert.alert("Reservation Error", message, [{ text: "OK" }]);
      setConfirmVisible(false);
      setModalVisible(false);
      setSelectedTrip(null);
      setSelectedSeat(null);
    } finally {
      setReserving(false);
    }
  };

  const seatsAfterBooking = useMemo(() => {
    if (!selectedTrip) return null;
    const remaining = (selectedTrip.seatsAvailable ?? 0) - 1;
    return remaining >= 0 ? remaining : 0;
  }, [selectedTrip]);

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

        <View style={styles.searchBar}>
          <Image
            source={require("../../assets/searchIcon0.png")}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search routes..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Text style={styles.statusText}>Loading schedules...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : filteredTrips.length === 0 ? (
          <Text style={styles.statusText}>
            {searchQuery.trim()
              ? `No trips found matching "${searchQuery}"`
              : "No scheduled trips found."}
          </Text>
        ) : (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>
              Available Trips{searchQuery.trim() ? ` (${filteredTrips.length})` : ""}
            </Text>
            <View style={styles.cardList}>
              {filteredTrips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => handleTripPress(trip)}
                  activeOpacity={0.92}
                >
                  <View style={styles.circle}>
                    <Image
                      source={require("../../assets/routereserve-icon.png")}
                      style={styles.circleIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.tripBody}>
                    <Text style={styles.tripTitle}>{trip.title}</Text>
                    {!!trip.time && (
                      <Text style={styles.detailText}>Time: {trip.time}</Text>
                    )}
                    {trip.driverName && (
                      <Text style={styles.detailText}>Driver: {trip.driverName}</Text>
                    )}
                    {!!trip.seats && (
                      <Text style={styles.detailText}>
                        Available Seats: {trip.seats}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={handleClose}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT PREFERRED SEAT</Text>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.seatGrid}>
              {seatRows.map((row, rowIdx) => (
                <View key={`row-${rowIdx}`} style={styles.seatRow}>
                  {row.slice(0, 2).map((seat) => (
                    <Pressable
                      key={seat.number}
                      onPress={() =>
                        seat.available && setSelectedSeat(seat.number)
                      }
                      style={[
                        styles.seatBox,
                        seat.available
                          ? styles.seatAvailable
                          : styles.seatTaken,
                        selectedSeat === seat.number && styles.seatSelected,
                      ]}
                    >
                      <Image
                        source={require("../../assets/busSeatIcon.png")}
                        style={styles.seatIcon}
                        resizeMode="contain"
                      />
                    </Pressable>
                  ))}
                  <View style={styles.aisleSpacer} />
                  {row.slice(2, 4).map((seat) => (
                    <Pressable
                      key={seat.number}
                      onPress={() =>
                        seat.available && setSelectedSeat(seat.number)
                      }
                      style={[
                        styles.seatBox,
                        seat.available
                          ? styles.seatAvailable
                          : styles.seatTaken,
                        selectedSeat === seat.number && styles.seatSelected,
                      ]}
                    >
                      <Image
                        source={require("../../assets/busSeatIcon.png")}
                        style={styles.seatIcon}
                        resizeMode="contain"
                      />
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.reserveButton}
              activeOpacity={0.9}
              onPress={handleReservePress}
              disabled={reserving}
            >
              <Text style={styles.reserveText}>
                {reserving ? "RESERVING..." : "RESERVE SEAT"}
              </Text>
            </TouchableOpacity>

            {!!reserveMessage && (
              <Text style={styles.reserveMessage}>{reserveMessage}</Text>
            )}

            {selectedTrip && (
              <View style={styles.modalFooter}>
                <Text style={styles.footerText}>Route: {selectedTrip.route}</Text>
                <Text style={styles.footerText}>{selectedTrip.seats}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={confirmVisible}
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeader}>
              <Text style={styles.modalTitle}>TRIP DETAILS</Text>
              <Pressable
                onPress={() => setConfirmVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <View style={styles.confirmBody}>
              {selectedTrip?.shuttleName && (
                <Text style={styles.confirmItem}>
                  Shuttle: {selectedTrip.shuttleName}
                </Text>
              )}
              {selectedTrip?.driverName && (
                <Text style={styles.confirmItem}>
                  Driver: {selectedTrip.driverName}
                </Text>
              )}
              <Text style={styles.confirmItem}>
                Time: {selectedTrip?.time || "TBD"}
              </Text>
              <Text style={styles.confirmItem}>
                Seat Reserved: {selectedSeat ? `Seat ${selectedSeat}` : "N/A"}
              </Text>
              <Text style={styles.confirmItem}>
                Available Seats (after booking):{" "}
                {seatsAfterBooking ?? "Updating"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              activeOpacity={0.9}
              onPress={handleReserve}
              disabled={reserving}
            >
              <Text style={styles.confirmButtonText}>
                {reserving ? "PROCESSING..." : "Confirm Reservation"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.9}
              onPress={() => setConfirmVisible(false)}
              disabled={reserving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    padding: 0,
  },
  searchIcon: {
    height: 18,
    width: 18,
  },
  clearButton: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 18,
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
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
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
  tripBody: {
    flex: 1,
    gap: 6,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  detailText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
    marginTop: 8,
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
  modalTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0a0a0a",
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
    fontSize: 22,
    fontWeight: "900",
    color: "#000",
    marginTop: -2,
  },
  seatGrid: {
    gap: 12,
    marginBottom: 16,
  },
  seatRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  aisleSpacer: {
    width: 22,
  },
  seatBox: {
    height: 48,
    width: 48,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  seatAvailable: {
    borderColor: "#0c8b2f",
  },
  seatTaken: {
    borderColor: "#c62828",
    opacity: 0.7,
  },
  seatSelected: {
    borderColor: "#1d4ed8",
    backgroundColor: "#eef1ff",
    shadowColor: "#1d4ed8",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  seatIcon: {
    height: 28,
    width: 28,
  },
  reserveButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  reserveText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  modalFooter: {
    alignItems: "center",
    gap: 2,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
  },
  reserveMessage: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 10,
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  confirmBody: {
    gap: 6,
    marginBottom: 14,
  },
  confirmItem: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  confirmButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  cancelButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d9d9d9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
  },
});
