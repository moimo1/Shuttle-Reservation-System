const API_BASE_URL = __DEV__
  ? "http://192.168.31.251:5000/api"
  : "http://localhost:5000/api";

export type DriverReservation = {
  name: string;
  email: string;
  destination: string;
  seatNumber: number;
  departureTime: string;
  shuttleName: string;
};

export const fetchDriverReservations = async (
  token?: string | null,
  filters?: { shuttleId?: string; departureTime?: string; destination?: string }
): Promise<DriverReservation[]> => {
  const params = new URLSearchParams();
  if (filters?.shuttleId) params.append("shuttleId", filters.shuttleId);
  if (filters?.departureTime) params.append("departureTime", filters.departureTime);
  if (filters?.destination) params.append("destination", filters.destination);

  const response = await fetch(
    `${API_BASE_URL}/driver/reservations${params.toString() ? `?${params}` : ""}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load driver reservations");
  }

  return data;
};

