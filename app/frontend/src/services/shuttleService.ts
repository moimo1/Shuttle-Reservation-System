const API_BASE_URL = __DEV__
  ? "http://192.168.1.2:5000/api" 
  : "http://localhost:5000/api";

export type Trip = {
  _id: string;
  shuttle?: string;
  shuttleName?: string;
  driverName?: string | null;
  departureTime: string;
  seatsAvailable: number;
  takenSeats?: number[];
  destination?: string;
  direction?: "forward" | "reverse";
};

export const fetchShuttles = async (): Promise<Trip[]> => {
  const response = await fetch(`${API_BASE_URL}/shuttles`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load trips");
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

