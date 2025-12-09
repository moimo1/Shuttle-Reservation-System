import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Alert } from "react-native";
import { getCurrentUser, updateAvatar, getAuthToken } from "../services/authService";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [avatarInput, setAvatarInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const handleLogout = () => {
    navigation.replace("Login");
  };

  const handleSaveAvatar = async () => {
    if (!avatarInput.trim()) {
      Alert.alert("Avatar", "Please paste an image URL.");
      return;
    }
    try {
      setSaving(true);
      const token = getAuthToken();
      const result = await updateAvatar(avatarInput.trim(), token);
      if (result?.user) {
        setUser(result.user);
        setAvatarInput("");
        Alert.alert("Saved", "Profile picture updated.");
      }
    } catch (err) {
      Alert.alert("Avatar update failed", err?.message || "Unable to update avatar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.greeting}>
            Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </Text>
          <Text style={styles.subGreeting}>Manage your account and trips</Text>
          {user?.role ? (
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{String(user.role).toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.avatarWrap}>
          <Image
            source={
              user?.avatarUrl
                ? { uri: user.avatarUrl }
                : require("../../assets/routereserve-icon.png")
            }
            style={styles.avatar}
            resizeMode="contain"
          />
        </View>
      </View>

      <View style={styles.card}>
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

      <View style={styles.grid}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Edit Profile</Text>
          <Text style={styles.actionDesc}>Update name or email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Change Password</Text>
          <Text style={styles.actionDesc}>Keep your account secure</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <Text style={styles.helperText}>Paste an image URL to use as your avatar.</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/me.jpg"
          placeholderTextColor="#9aa0b5"
          autoCapitalize="none"
          autoCorrect={false}
          value={avatarInput}
          onChangeText={setAvatarInput}
        />
        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.primaryDisabled]}
          onPress={handleSaveAvatar}
          disabled={saving}
        >
          <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Avatar"}</Text>
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
    backgroundColor: "#f5f7fb",
    padding: 20,
    gap: 16,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102478",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroLeft: {
    flex: 1,
    gap: 6,
  },
  greeting: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  subGreeting: {
    color: "#e6e9f5",
    fontSize: 13,
    fontWeight: "600",
  },
  avatarWrap: {
    height: 70,
    width: 70,
    borderRadius: 14,
    backgroundColor: "#e6f1fb",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  avatar: {
    height: 48,
    width: 48,
  },
  rolePill: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#1dd1a1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: {
    color: "#0c2a63",
    fontSize: 12,
    fontWeight: "800",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6e9f2",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0c2a63",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5c5f6f",
  },
  value: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0c2a63",
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e6e9f2",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0c2a63",
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5c5f6f",
  },
  helperText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7082",
    marginBottom: 8,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d6d9e4",
    paddingHorizontal: 12,
    backgroundColor: "#f7f8fb",
    fontSize: 13,
    fontWeight: "700",
    color: "#0c2a63",
    marginBottom: 10,
  },
  logoutButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#c62828",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  primaryDisabled: {
    opacity: 0.6,
  },
});
