import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { getCurrentUser } from "../services/authService";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    navigation.replace("Login"); // Return to login screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image
            source={require("../../assets/routereserve-icon.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{user?.name || "Guest"}</Text>
          <Text style={styles.email}>{user?.email || "Not signed in"}</Text>
          {user?.role ? (
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{String(user.role).toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.name || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || "—"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user?.role || "—"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarWrap: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: "#E6F1FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatar: {
    height: 48,
    width: 48,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
  },
  email: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  rolePill: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#102478",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
  value: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
  },
  primaryButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: "#102478",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  logoutButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#c62828",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
