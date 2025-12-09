/**
 * API Configuration
 * 
 * IMPORTANT: Change the IP address below to your machine's local IP address
 * when running the backend server. This allows your mobile device/emulator to connect.
 * 
 * To find your IP address:
 * - Windows: Run `ipconfig` in CMD and look for "IPv4 Address"
 * - Mac/Linux: Run `ifconfig` or `ip addr` and look for your local network IP
 * 
 * Example: If your IP is 192.168.1.100, change it to:
 *   ? "http://192.168.1.100:5000/api"
 */

export const API_BASE_URL = __DEV__
  ? "http://192.168.1.2:5000/api" // TODO: Change this to your local IP address
  : "http://localhost:5000/api";

