// API Configuration for offline/local network demo
// For multi-user support on the same network:
// 1. Find your computer's local IP address (run: npm run get-ip or see demo guide)
// 2. Replace YOUR_LOCAL_IP below with your actual IP (e.g., "192.168.1.100")
// 3. Make sure all devices are on the same WiFi network

// Change this to your computer's local IP address for network access
// Leave as localhost if only testing on the same machine
const LOCAL_IP = "10.148.70.212";

export const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:5000/api`
  : "http://localhost:5000/api";

