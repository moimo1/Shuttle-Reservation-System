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
import { getAuthToken } from "../services/authService";

type TripGroup = {
  key: string;
  shuttleName: string;
  departureTime: string;
  passengers: DriverReservation[];
};

export default function DriverReservationsScreen() {
  const [reservations, setReservations] = useState<DriverReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripGroup | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [destinationFilter, setDestinationFilter] = useState("");
  const [presence, setPresence] = useState<Record<string, "present" | "absent">>({});

  const groupedTrips = useMemo<TripGroup[]>(() => {
    const groups: Record<string, TripGroup> = {};

    const filtered = reservations.filter((res) => {
      if (!destinationFilter.trim()) return true;
      return res.destination?.toLowerCase().includes(destinationFilter.trim().toLowerCase());
    });

    filtered.forEach((res) => {
      const key = `${res.shuttleName}-${res.departureTime || "time"}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          shuttleName: res.shuttleName || "Shuttle",
          departureTime: res.departureTime || "TBD",
          passengers: [],
        };
      }
      groups[key].passengers.push(res);
    });

    // Sort passengers by destination (nearest drop-off proxy)
    return Object.values(groups).map((g) => ({
      ...g,
      passengers: [...g.passengers].sort((a, b) =>
        (a.destination || "").localeCompare(b.destination || "")
      ),
    }));
  }, [reservations, destinationFilter]);

  const loadReservations = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
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

  const handleViewTrip = (trip: TripGroup) => {
    setSelectedTrip(trip);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTrip(null);
  };

  const handleAcknowledge = () => {
    handleCloseModal();
    Alert.alert("Acknowledged", "Reservation update acknowledged.");
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerEdgeToEdge}>
          <AppHeader />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>WELCOME @DRIVER!</Text>
          <Text style={styles.dateText}>INCOMING RESERVATIONS</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryButton} onPress={loadReservations} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? "Refreshing..." : "Refresh"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Filter by destination</Text>
          <TextInput
            placeholder="e.g. Main Campus"
            placeholderTextColor="#666"
            value={destinationFilter}
            onChangeText={setDestinationFilter}
            style={styles.filterInput}
          />
        </View>

        {error ? <Text style={styles.statusText}>{error}</Text> : null}
        {!error && loading ? <Text style={styles.statusText}>Loading reservations...</Text> : null}
        {!loading && !error && groupedTrips.length === 0 ? (
          <Text style={styles.statusText}>No incoming reservations.</Text>
        ) : null}

        {!loading &&
          !error &&
          groupedTrips.map((trip) => (
            <TouchableOpacity
              key={trip.key}
              style={styles.tripCard}
              onPress={() => handleViewTrip(trip)}
              activeOpacity={0.9}
            >
              <Text style={styles.tripTitle}>ONGOING TRIP</Text>
              <Text style={styles.detailText}>Time: {trip.departureTime}</Text>
              <Text style={styles.detailText}>Route: {trip.shuttleName}</Text>
              <Text style={styles.detailText}>
                Passengers: {trip.passengers.length} / 20
              </Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.linkButton} onPress={() => handleViewTrip(trip)}>
                  <Text style={styles.linkText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.linkButton} onPress={handleStartTrip}>
                  <Text style={styles.linkText}>Start Trip</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>TRIP DETAILS</Text>
              <Pressable onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {selectedTrip ? (
              <>
                <Text style={styles.detailText}>Time: {selectedTrip.departureTime}</Text>
                <Text style={styles.detailText}>Route: {selectedTrip.shuttleName}</Text>
                <Text style={[styles.detailText, styles.sectionLabel]}>Passenger List</Text>
                <View style={styles.passengerList}>
                  {selectedTrip.passengers.map((p, idx) => (
                    <View key={`${p.email}-${idx}`} style={styles.passengerRow}>
                      <Text style={styles.passengerSeat}>Seat {p.seatNumber}</Text>
                      <View style={styles.passengerInfo}>
                        <Text style={styles.passengerName}>{p.name}</Text>
                        <Text style={styles.passengerDest}>{p.destination}</Text>
                      </View>
                      <View style={styles.presencePills}>
                        <TouchableOpacity
                          style={[
                            styles.presencePill,
                            presence[`${p.email}-${p.seatNumber}`] !== "absent"
                              ? styles.present
                              : styles.pillNeutral,
                          ]}
                          onPress={() => togglePresence(`${p.email}-${p.seatNumber}`, "present")}
                        >
                          <Text
                            style={[
                              styles.presenceText,
                              presence[`${p.email}-${p.seatNumber}`] !== "absent"
                                ? styles.presentText
                                : styles.pillText,
                            ]}
                          >
                            Present
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.presencePill,
                            presence[`${p.email}-${p.seatNumber}`] === "absent"
                              ? styles.absent
                              : styles.pillNeutral,
                          ]}
                          onPress={() => togglePresence(`${p.email}-${p.seatNumber}`, "absent")}
                        >
                          <Text
                            style={[
                              styles.presenceText,
                              presence[`${p.email}-${p.seatNumber}`] === "absent"
                                ? styles.absentText
                                : styles.pillText,
                            ]}
                          >
                            Absent
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleAcknowledge}>
                <Text style={styles.secondaryText}>Acknowledge</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleEndTrip}>
                <Text style={styles.primaryButtonText}>End Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  primaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#102478",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginTop: 8,
  },
  tripCard: {
    backgroundColor: "#e6e6e6",
    borderRadius: 10,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#c4c4c4",
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f7d2a",
    textTransform: "uppercase",
  },
  detailText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  linkButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  linkText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#102478",
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
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
  },
  closeButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
    marginTop: -2,
  },
  passengerList: {
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  passengerSeat: {
    fontSize: 12,
    fontWeight: "800",
    color: "#102478",
    minWidth: 70,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
  },
  passengerDest: {
    fontSize: 11,
    fontWeight: "700",
    color: "#444",
  },
  sectionLabel: {
    marginTop: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f3f3",
  },
  secondaryText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
  presencePills: {
    flexDirection: "row",
    gap: 6,
  },
  presencePill: {
    borderWidth: 1,
    borderColor: "#c4c4c4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presenceText: {
    fontSize: 11,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
  },
  filterInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
    fontSize: 12,
    fontWeight: "600",
  },
});

