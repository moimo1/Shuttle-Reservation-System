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
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { fetchShuttles } from "../services/shuttleService";

export default function ViewScheduleScreen() {
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchShuttles();
        setShuttles(data);
      } catch (err) {
        setError(err?.message || "Failed to load schedules");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trips = useMemo(
    () =>
      shuttles.map((shuttle, idx) => ({
        id: shuttle._id || String(idx),
        title: `SCHEDULED TRIP ${idx + 1}`,
        time: shuttle.departureTime || "TBD",
        route: shuttle.name || "Route not set",
        seats: `${shuttle.seatsAvailable ?? 0} seats left`,
        seatsAvailable: shuttle.seatsAvailable ?? 0,
      })),
    [shuttles]
  );

  const seatMap = useMemo(() => {
    if (!selectedTrip) return [];
    const totalSeats = 20;
    const availableCount = Math.max(
      0,
      Math.min(totalSeats, selectedTrip.seatsAvailable || 0)
    );
    return Array.from({ length: totalSeats }, (_, i) => ({
      number: i + 1,
      available: i < availableCount,
    }));
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
    setModalVisible(true);
  };

  const handleClose = () => {
    setModalVisible(false);
    setSelectedTrip(null);
    setSelectedSeat(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerEdgeToEdge}>
          <AppHeader />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>WELCOME @USER!</Text>
          <Text style={styles.dateText}>TODAY IS JANUARY 14, 2025(TUESDAY)</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>VIEW SCHEDULE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>MY BOOKINGS</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBar}>
          <Image
            source={require("../../assets/searchIcon0.png")}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <Text style={styles.searchText}>SEARCH</Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.statusText}>Loading schedules...</Text>
        ) : error ? (
          <Text style={styles.statusText}>{error}</Text>
        ) : trips.length === 0 ? (
          <Text style={styles.statusText}>No scheduled trips found.</Text>
        ) : (
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onPress={() => handleTripPress(trip)}
              activeOpacity={0.9}
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
                {!!trip.route && (
                  <Text style={styles.detailText}>Route: {trip.route}</Text>
                )}
                {!!trip.seats && (
                  <Text style={styles.detailText}>
                    Available Seats: {trip.seats}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
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

            <TouchableOpacity style={styles.reserveButton} activeOpacity={0.9}>
              <Text style={styles.reserveText}>RESERVE SEAT</Text>
            </TouchableOpacity>

            {selectedTrip && (
              <View style={styles.modalFooter}>
                <Text style={styles.footerText}>Route: {selectedTrip.route}</Text>
                <Text style={styles.footerText}>{selectedTrip.seats}</Text>
              </View>
            )}
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    height: 38,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  searchText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  searchIcon: {
    height: 18,
    width: 18,
  },
  tripCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    padding: 16,
    gap: 14,
    alignItems: "center",
  },
  circle: {
    height: 52,
    width: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#7d7d7d",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  circleIcon: {
    height: 34,
    width: 34,
  },
  tripBody: {
    flex: 1,
    gap: 4,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  detailText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
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
    maxWidth: 360,
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
    borderColor: "#1e88e5",
    shadowColor: "#1e88e5",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  seatIcon: {
    height: 28,
    width: 28,
  },
  reserveButton: {
    height: 42,
    borderRadius: 6,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  reserveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  modalFooter: {
    alignItems: "center",
    gap: 2,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000",
  },
});
