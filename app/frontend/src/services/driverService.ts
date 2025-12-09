import { API_BASE_URL } from "../config/api";

export type DriverReservation = {
  name: string;
  email: string;
  destination: string;
  seatNumber: number;
  departureTime: string;
  shuttleName: string;
};

export type TripHistory = {
  id: string;
  date: string;
  time: string;
  route: string;
  passengerCount: number;
  passengers: Array<{
    name: string;
    destination: string;
  }>;
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

export const fetchDriverHistory = async (
  token?: string | null,
  filters?: { date?: string; destination?: string; minPassengers?: string }
): Promise<TripHistory[]> => {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.destination) params.append("destination", filters.destination);
  if (filters?.minPassengers) params.append("minPassengers", filters.minPassengers);

  const response = await fetch(
    `${API_BASE_URL}/driver/history${params.toString() ? `?${params}` : ""}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load driver history");
  }

  return data;
};

