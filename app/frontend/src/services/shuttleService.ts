const API_BASE_URL = __DEV__
  ? "http://192.168.31.251:5000/api" // Development: device needs LAN IP
  : "http://localhost:5000/api";

export type Shuttle = {
  _id: string;
  name: string;
  departureTime: string;
  seatsAvailable: number;
  takenSeats?: number[];
  destination?: string;
};

export const fetchShuttles = async (): Promise<Shuttle[]> => {
  const response = await fetch(`${API_BASE_URL}/shuttles`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load shuttles");
  }

  return data;
};

export const reserveSeat = async (
  shuttleId: string,
  seatNumber: number,
  destination: string,
  token?: string | null
) => {
  const response = await fetch(`${API_BASE_URL}/shuttles/reserve/${shuttleId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ seatNumber, destination }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Reservation failed");
  }

  return data;
};

