import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { login } from "../services/authService";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  PassengerTabs: undefined;
  DriverTabs: undefined;
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"driver" | "passenger">("passenger");
  const [error, setError] = useState("");

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }

    setError("");
    try {
      const result: any = await login(email, password);
      const role = result?.user?.role;
      if (!role) {
        setError("No role found on this account.");
        return;
      }
      if (role !== selectedRole) {
        setError(`This account is registered as ${role}. Please login as ${role}.`);
        return;
      }

      if (role === "driver") {
        navigation.navigate("DriverTabs");
      } else {
        navigation.navigate("PassengerTabs");
      }
    } catch (err: any) {
      const msg = err?.message || "Login failed. Please check your credentials.";
      setError(msg);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Login as</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleOption, selectedRole === "passenger" && styles.roleOptionSelected]}
          onPress={() => setSelectedRole("passenger")}
        >
          <Text style={[styles.roleText, selectedRole === "passenger" && styles.roleTextSelected]}>
            Passenger
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleOption, selectedRole === "driver" && styles.roleOptionSelected]}
          onPress={() => setSelectedRole("driver")}
        >
          <Text style={[styles.roleText, selectedRole === "driver" && styles.roleTextSelected]}>
            Driver
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
      
      <TouchableOpacity>
        <Text style={styles.link}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    padding: 30
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    marginBottom: 40,
    textAlign: "center",
  },
  error: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  roleOptionSelected: {
    borderColor: "#4A90E2",
    backgroundColor: "#E6F1FB",
  },
  roleText: {
    fontSize: 16,
    color: "#555",
  },
  roleTextSelected: {
    color: "#4A90E2",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
  },
  link: {
    color: "#4A90E2",
    textAlign: "center",
    fontSize: 16,
  },
});
