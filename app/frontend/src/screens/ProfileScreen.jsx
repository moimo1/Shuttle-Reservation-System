import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getCurrentUser, uploadAvatarImage, getAuthToken } from "../services/authService";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [imageBase64, setImageBase64] = useState("");

  useEffect(() => {
    const current = getCurrentUser();
    setUser(current);
    setPreviewUri(current?.avatarUrl || null);
  }, []);

  const handleLogout = () => {
    navigation.replace("Login");
  };

  const handleEditProfile = () => {
    Alert.alert("Edit profile", "Profile editing is not implemented yet.");
  };

  const handleChangePassword = () => {
    Alert.alert("Change password", "Password change is not implemented yet.");
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "We need access to your photos to upload an avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6, // smaller payload to avoid UI jank on base64
      base64: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

    // guard against very large selections that can freeze the UI
    const estimatedBytes = asset.base64 ? asset.base64.length * (3 / 4) : 0;
    const maxBytes = 4 * 1024 * 1024; // 4MB
    if (estimatedBytes > maxBytes) {
      Alert.alert("Image too large", "Please choose a smaller image (under ~4MB).");
      return;
    }

    const base64String = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : "";
    setPreviewUri(asset.uri || null);
    setImageBase64(base64String);
  };

  const handleUploadImage = async () => {
    if (!imageBase64) {
      Alert.alert("Upload", "Pick an image first.");
      return;
    }

    try {
      setUploading(true);
      const token = getAuthToken();
      const result = await uploadAvatarImage(imageBase64, token);
      if (result?.user) {
        setUser(result.user);
        setPreviewUri(result.user.avatarUrl || null);
        setImageBase64("");
        Alert.alert("Uploaded", "Profile picture updated.");
      }
    } catch (err) {
      Alert.alert("Upload failed", err?.message || "Unable to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroLeft}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.nameText}>{user?.name || "Traveler"}</Text>
          <Text style={styles.subGreeting}>Manage your identity, safety, and preferences.</Text>
          {user?.role ? (
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{String(user.role).toUpperCase()}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.avatarZone}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
            <View style={styles.avatarShadow}>
              <Image
                source={
                  previewUri
                    ? { uri: previewUri }
                    : require("../../assets/routereserve-icon.png")
                }
                style={styles.avatar}
              />
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraBadgeText}>📷</Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to choose a new photo</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile overview</Text>
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <TouchableOpacity style={styles.actionRow} onPress={handleEditProfile}>
            <Text style={styles.actionTitle}>Edit profile</Text>
            <Text style={styles.actionDesc}>Update your name or email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, styles.actionRowLast]} onPress={handleChangePassword}>
            <Text style={styles.actionTitle}>Change password</Text>
            <Text style={styles.actionDesc}>Keep your account secure</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile picture</Text>
        <Text style={styles.helperText}>Upload from your device.</Text>

        <View style={styles.uploadRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
            <Text style={styles.secondaryText}>Choose from device</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, uploading && styles.primaryDisabled]}
            onPress={handleUploadImage}
            disabled={uploading}
          >
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Upload</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 64,
  },
  heroCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    backgroundColor: "#0c2a63",
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 12,
  },
  heroLeft: {
    flex: 1,
    gap: 8,
  },
  greeting: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.9,
  },
  nameText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  subGreeting: {
    color: "#dbe4ff",
    fontSize: 13,
    fontWeight: "600",
  },
  avatarZone: {
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: 12,
  },
  avatarShadow: {
    height: 96,
    width: 96,
    borderRadius: 22,
    backgroundColor: "#f5f7fb",
    borderWidth: 1,
    borderColor: "#dfe6f5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  avatar: {
    height: 88,
    width: 88,
    borderRadius: 20,
  },
  cameraBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    height: 30,
    width: 30,
    borderRadius: 12,
    backgroundColor: "#1dd1a1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cameraBadgeText: {
    fontSize: 16,
  },
  avatarHint: {
    color: "#e8edff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
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
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8edf5",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    gap: 14,
  },
  cardStack: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0c2a63",
    letterSpacing: 0.1,
    marginBottom: 6,
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
    gap: 16,
    marginBottom: 4,
  },
  actionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef1f6",
    gap: 2,
  },
  actionRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0c2a63",
    letterSpacing: 0.1,
  },
  actionDesc: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5c5f6f",
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6f7488",
    marginBottom: 14,
    lineHeight: 16,
  },
  uploadRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#102478",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    minWidth: 140,
  },
  primaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#102478",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  secondaryText: {
    color: "#102478",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
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
