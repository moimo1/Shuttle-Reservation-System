import React, { useMemo, useState } from "react";
import {
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
import { getCurrentUser } from "../services/authService";

type Passenger = {
  name: string;
  destination: string;
};

type TripHistory = {
  id: string;
  date: string;
  time: string;
  route: string;
  passengerCount: number;
  passengers: Passenger[];
};

const MOCK_HISTORY: TripHistory[] = [
  {
    id: "1",
    date: "2025-01-10",
    time: "07:30 AM",
    route: "SLU Main Campus → Bakakeng",
    passengerCount: 18,
    passengers: [
      { name: "Anne Villamor", destination: "Bakakeng" },
      { name: "John Cruz", destination: "SLU Main Campus" },
    ],
  },
  {
    id: "2",
    date: "2025-01-09",
    time: "05:45 AM",
    route: "Bakakeng → SLU Main Campus",
    passengerCount: 14,
    passengers: [
      { name: "Maria Santos", destination: "SLU Main Campus" },
      { name: "Leo Ramos", destination: "SLU Main Campus" },
    ],
  },
];

export default function DriverHistoryScreen() {
  const [dateFilter, setDateFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [minPassengers, setMinPassengers] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const displayName = useMemo(() => {
    const user = getCurrentUser();
    const name = user?.name || "Driver";
    return name.toUpperCase();
  }, []);

  const filteredHistory = useMemo(() => {
    return MOCK_HISTORY.filter((trip) => {
      const matchDate = dateFilter ? trip.date.includes(dateFilter) : true;
      const matchDestination = destinationFilter
        ? trip.passengers.some((p) =>
            p.destination.toLowerCase().includes(destinationFilter.toLowerCase())
          )
        : true;
      const matchCount =
        minPassengers.trim() === "" ? true : trip.passengerCount >= Number(minPassengers);
      return matchDate && matchDestination && matchCount;
    });
  }, [dateFilter, destinationFilter, minPassengers]);

  const totalPassengers = useMemo(
    () => filteredHistory.reduce((sum, trip) => sum + trip.passengerCount, 0),
    [filteredHistory]
  );

  const clearFilters = () => {
    setDateFilter("");
    setDestinationFilter("");
    setMinPassengers("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerEdgeToEdge}>
          <AppHeader />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>WELCOME {displayName}!</Text>
          <Text style={styles.dateText}>DRIVING HISTORY</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Trips</Text>
            <Text style={styles.kpiValue}>{filteredHistory.length}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Passengers</Text>
            <Text style={styles.kpiValue}>{totalPassengers}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Filters</Text>
            <Text style={styles.kpiValue}>
              {[dateFilter, destinationFilter, minPassengers].filter(Boolean).length}
            </Text>
          </View>
        </View>

        <View style={styles.filterCard}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterLabel}>Filter trips</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor="#666"
            value={dateFilter}
            onChangeText={setDateFilter}
            style={styles.filterInput}
          />
          <TextInput
            placeholder="Destination"
            placeholderTextColor="#666"
            value={destinationFilter}
            onChangeText={setDestinationFilter}
            style={styles.filterInput}
          />
          <TextInput
            placeholder="Min passengers (e.g. 10)"
            placeholderTextColor="#666"
            value={minPassengers}
            onChangeText={setMinPassengers}
            style={styles.filterInput}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.sectionBlock}>
          {filteredHistory.map((trip) => {
            const expanded = expandedId === trip.id;
            return (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <View style={styles.datePill}>
                    <Text style={styles.datePillText}>{trip.date}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{trip.passengerCount} pax</Text>
                  </View>
                </View>

                <Text style={styles.tripTitle}>{trip.route}</Text>
                <Text style={styles.detailText}>{trip.time}</Text>

                <View style={styles.divider} />

                <View style={styles.tripMetaRow}>
                  <Text style={styles.metaLabel}>Route</Text>
                  <Text style={styles.metaValue}>{trip.route}</Text>
                </View>
                <View style={styles.tripMetaRow}>
                  <Text style={styles.metaLabel}>Passengers</Text>
                  <Text style={styles.metaValue}>{trip.passengerCount}</Text>
                </View>

                <TouchableOpacity
                  style={styles.togglePassengers}
                  onPress={() => setExpandedId(expanded ? null : trip.id)}
                >
                  <Text style={styles.toggleText}>{expanded ? "Hide" : "View"} passengers</Text>
                </TouchableOpacity>

                {expanded ? (
                  <View style={styles.passengerList}>
                    {trip.passengers.map((p, idx) => (
                      <View key={`${p.name}-${idx}`} style={styles.passengerRow}>
                        <Text style={styles.passengerName}>{p.name}</Text>
                        <Text style={styles.passengerDest}>{p.destination}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {filteredHistory.length === 0 ? (
          <Text style={styles.statusText}>No trips match your filters.</Text>
        ) : null}
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
    paddingVertical: 4,
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
  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  filterCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  clearText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1d4ed8",
  },
  filterInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
    fontSize: 12,
    fontWeight: "700",
  },
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#0f7d2a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  detailText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  tripMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  togglePassengers: {
    marginTop: 6,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#eef1ff",
    borderWidth: 1,
    borderColor: "#cdd4ff",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d4ed8",
  },
  passengerList: {
    backgroundColor: "#f8f9ff",
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e4e7ff",
  },
  passengerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  passengerName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  passengerDest: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4b5563",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "center",
    marginTop: 12,
  },
  sectionBlock: {
    gap: 12,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#eef1ff",
    borderWidth: 1,
    borderColor: "#cdd4ff",
  },
  datePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f1e6b",
  },
  divider: {
    height: 1,
    backgroundColor: "#eceff5",
    marginVertical: 8,
  },
});
