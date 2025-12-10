import os from "os";

/**
 * Get the local IP address of the machine on the local network
 * Returns the first non-internal IPv4 address
 */
export function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (!networkInterface) continue;
    
    for (const iface of networkInterface) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return "localhost";
}

