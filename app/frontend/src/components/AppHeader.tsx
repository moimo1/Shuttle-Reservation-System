import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  onNotifPress?: () => void;
};

export default function AppHeader({ onNotifPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconButton} />

      <View style={styles.logoWrap}>
        <Image
          source={require("../../assets/routereserve-icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity
        onPress={onNotifPress}
        activeOpacity={0.8}
        style={styles.iconButton}
      >
        <Image
          source={require("../../assets/notifIcon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 96,
    backgroundColor: "#4169e1", // royal blue
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    height: 60,
    width: 180,
  },
  iconButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    height: 26,
    width: 26,
  },
});

