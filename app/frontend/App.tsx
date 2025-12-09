import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import ScheduleScreen from "./src/screens/ScheduleScreen";
import MapScreen from "./src/screens/MapScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
<<<<<<< HEAD
import DriverReservationsScreen from "./src/screens/DriverReservationsScreen";
import DriverHistoryScreen from "./src/screens/DriverHistoryScreen";
=======
import MyBookingsScreen from "./src/screens/MyBookingsScreen";
>>>>>>> 1cf79b9467c8d9e2f179e874dacc668d47e71356

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Schedule: "calendar-outline",
  Map: "location-outline",
  Profile: "person-circle-outline",
  Driver: "speedometer-outline", // steering-wheel-like
  History: "time-outline",
};

const useTabOptions = () => {
  const insets = useSafeAreaInsets();
  return React.useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: "#0c2a63",
      tabBarInactiveTintColor: "#9aa0b5",
      tabBarLabelStyle: { fontSize: 11, fontWeight: "700" as const },
      tabBarStyle: {
        height: 60 + insets.bottom,
        paddingBottom: 8 + insets.bottom,
        paddingTop: 8,
      },
    }),
    [insets.bottom]
  );
};

const renderTabIcon = (routeName: string, color: string, size: number) => {
  const iconName = tabIcons[routeName] || "ellipse-outline";
  return <Ionicons name={iconName} size={size + 2} color={color} />;
};

function PassengerTabs() {
  const tabOptions = useTabOptions();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabOptions,
        tabBarIcon: ({ color, size }) => renderTabIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function DriverTabs() {
  const tabOptions = useTabOptions();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabOptions,
        tabBarIcon: ({ color, size }) => renderTabIcon(route.name, color, size),
      })}
    >
      <Tab.Screen name="Driver" component={DriverReservationsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="History" component={DriverHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
<<<<<<< HEAD
        <Stack.Screen name="PassengerTabs" component={PassengerTabs} />
        <Stack.Screen name="DriverTabs" component={DriverTabs} />
=======

        {/* Bottom navbar after login */}
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
>>>>>>> 1cf79b9467c8d9e2f179e874dacc668d47e71356
      </Stack.Navigator>
    </NavigationContainer>
  );
}

type SplashProps = { onFinish: () => void };

function SplashScreen({ onFinish }: SplashProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const pulse = useRef(new Animated.Value(0.7)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(28)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.72,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const glowWave = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 }
    );

    intro.start(() => {
      pulseLoop.start();
      rotateLoop.start();
      glowWave.start();
    });

    const timer = setTimeout(onFinish, 2600);
    return () => clearTimeout(timer);
  }, [fade, scale, pulse, rotate, glow, slideUp, onFinish]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const haloOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.6],
  });

  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.accentOne} />
      <View style={splashStyles.accentTwo} />
      <Animated.View
        style={[
          splashStyles.logoWrap,
          { opacity: fade, transform: [{ scale }, { translateY: slideUp }] },
        ]}
      >
        <Animated.View style={[splashStyles.rotatingRing, { transform: [{ rotate: spin }] }]} />
        <Animated.View style={[splashStyles.glowHalo, { opacity: haloOpacity }]} />
        <View style={splashStyles.logoCircle}>
          <Animated.Image
            source={require("./assets/routereserve-icon.png")}
            style={[splashStyles.logo, { transform: [{ scale: pulse }] }]}
            resizeMode="contain"
          />
        </View>
        <Text style={splashStyles.appName}>Routereserve</Text>
        <Text style={splashStyles.tagline}>Your seat, your route</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f2f6b",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  accentOne: {
    position: "absolute",
    top: -120,
    right: -60,
    height: 240,
    width: 240,
    borderRadius: 140,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  accentTwo: {
    position: "absolute",
    bottom: -140,
    left: -90,
    height: 280,
    width: 280,
    borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  logoWrap: {
    alignItems: "center",
    gap: 12,
  },
  rotatingRing: {
    position: "absolute",
    height: 180,
    width: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
    borderStyle: "dashed",
  },
  glowHalo: {
    position: "absolute",
    height: 170,
    width: 170,
    borderRadius: 85,
    backgroundColor: "rgba(99, 167, 255, 0.25)",
    transform: [{ scale: 1.05 }],
  },
  logoCircle: {
    height: 120,
    width: 120,
    borderRadius: 30,
    backgroundColor: "#f5f8ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  logo: {
    height: 86,
    width: 86,
  },
  appName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  tagline: {
    color: "#e3ecff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
