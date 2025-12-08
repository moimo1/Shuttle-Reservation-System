const API_BASE_URL = __DEV__
  ? "http://192.168.31.251:5000/api" // Development: device needs LAN IP
  : "http://localhost:5000/api";

export type Shuttle = {
  _id: string;
  name: string;
  departureTime: string;
  seatsAvailable: number;
};

export const fetchShuttles = async (): Promise<Shuttle[]> => {
  const response = await fetch(`${API_BASE_URL}/shuttles`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load shuttles");
  }

  return data;
};

