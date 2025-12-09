import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AppHeader from "../components/AppHeader";
import { getCurrentUser, logout, uploadAvatarImage, getAuthToken } from "../services/authService";

export default function PassengerProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [imageBase64, setImageBase64] = useState("");

  const refreshUserData = () => {
    const current = getCurrentUser();
    if (current) {
      setUser(current);
      setPreviewUri(current?.avatarUrl || null);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshUserData();
    }, [])
  );

  const displayName = useMemo(() => {
    return user?.name?.toUpperCase() || "USER";
  }, [user]);

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
      quality: 0.6,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];

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
        refreshUserData();
        setImageBase64("");
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (err) {
      Alert.alert("Upload failed", err?.message || "Unable to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerEdgeToEdge}>
          <AppHeader subtitle="Profile & Settings" />
        </View>

        <View style={styles.welcomeWrap}>
          <Text style={styles.welcomeText}>WELCOME {displayName}!</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
              <View style={styles.avatarCircle}>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color="#1142a4" />
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || "User"}</Text>
              <Text style={styles.profileEmail}>{user?.email || "No email"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelWrap}>
                <Ionicons name="person-outline" size={18} color="#6b7280" />
                <Text style={styles.infoLabel}>Full Name</Text>
              </View>
              <Text style={styles.infoValue}>{user?.name || "Not set"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoLabelWrap}>
                <Ionicons name="mail-outline" size={18} color="#6b7280" />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user?.email || "Not set"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoLabelWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#6b7280" />
                <Text style={styles.infoLabel}>Account Type</Text>
              </View>
              <Text style={styles.infoValue}>Passenger</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.infoCard}>
            <Text style={styles.helperText}>Upload from your device</Text>
            <View style={styles.uploadRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
                <Text style={styles.secondaryText}>Choose from device</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, uploading && styles.primaryDisabled]}
                onPress={handleUploadImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: 6,
  },
  welcomeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarCircle: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: "#eef1ff",
    borderWidth: 2,
    borderColor: "#cdd4ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    height: 80,
    width: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
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
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 4,
  },
  helperText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  uploadRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1142a4",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  primaryDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  secondaryText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#dc2626",
    paddingHorizontal: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});

