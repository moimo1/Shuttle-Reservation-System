const API_BASE_URL = __DEV__
  ? "http://192.168.31.251:5000/api"
  : "http://localhost:5000/api";

export type Reservation = {
  _id: string;
  status: "active" | "cancelled";
  seatNumber: number;
  destination: string;
  createdAt?: string;
  cancelledAt?: string | null;
  shuttle?: {
    _id: string;
    name?: string;
    destination?: string;
    departureTime?: string;
    shuttleNumber?: string;
  };
};

export const fetchMyReservations = async (
  token?: string | null
): Promise<Reservation[]> => {
  const response = await fetch(`${API_BASE_URL}/reservations/my`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to load reservations");
  }

  return data;
};

export const cancelReservation = async (
  reservationId: string,
  token?: string | null
) => {
  const response = await fetch(
    `${API_BASE_URL}/reservations/${reservationId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to cancel reservation");
  }

  return data;
};


