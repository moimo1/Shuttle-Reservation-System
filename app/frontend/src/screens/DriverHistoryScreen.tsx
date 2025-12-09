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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerEdgeToEdge}>
          <AppHeader />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>WELCOME @DRIVER!</Text>
          <Text style={styles.dateText}>DRIVING HISTORY</Text>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>Filter trips</Text>
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

        {filteredHistory.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <Text style={styles.tripTitle}>{trip.route}</Text>
            <Text style={styles.detailText}>Date: {trip.date}</Text>
            <Text style={styles.detailText}>Time: {trip.time}</Text>
            <Text style={styles.detailText}>Passengers: {trip.passengerCount}</Text>

            <Text style={[styles.detailText, styles.sectionLabel]}>Passengers</Text>
            <View style={styles.passengerList}>
              {trip.passengers.map((p, idx) => (
                <View key={`${p.name}-${idx}`} style={styles.passengerRow}>
                  <Text style={styles.passengerName}>{p.name}</Text>
                  <Text style={styles.passengerDest}>{p.destination}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

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
  filterCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 8,
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
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#c4c4c4",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f7d2a",
  },
  detailText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  sectionLabel: {
    marginTop: 8,
  },
  passengerList: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginTop: 4,
  },
  passengerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
    marginTop: 12,
  },
});

