const API_BASE_URL = __DEV__
  ? "http://192.168.31.251:5000/api" // Development: use your computer's IP
  : "http://localhost:5000/api"; // Production: adjust as needed

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const register = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    if (data?.token) setAuthToken(data.token);
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Registration failed");
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (data?.token) setAuthToken(data.token);
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
};

