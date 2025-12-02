import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    navigation.replace("Login"); // Return to login screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 30, marginBottom: 40 },
  logoutButton: {
    backgroundColor: "red",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutText: { color: "#fff", fontSize: 18 },
});
