import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ViewMapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map View (Blank)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 22, color: "#666" },
});