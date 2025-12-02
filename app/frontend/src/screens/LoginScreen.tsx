import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet 
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }

    setError("");
    // TODO: Add authentication logic here
    console.log("Logging in with:", email, password);
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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
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
