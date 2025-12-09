const API_BASE_URL = __DEV__ 
  ? "http://192.168.2.9:5000/api"  
  : "http://localhost:5000/api";    

let authToken: string | null = null;
let currentUser: any | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const setCurrentUser = (user: any | null) => {
  currentUser = user;
};

export const getCurrentUser = () => currentUser;

export const updateAvatar = async (avatarUrl: string, token?: string | null) => {
  const auth = token || authToken;
  const response = await fetch(`${API_BASE_URL}/auth/avatar`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify({ avatarUrl }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to update avatar");
  }

  if (data?.user) setCurrentUser(data.user);
  return data;
};

export const uploadAvatarImage = async (imageBase64: string, token?: string | null) => {
  const auth = token || authToken;
  const response = await fetch(`${API_BASE_URL}/auth/avatar/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify({ imageBase64 }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Failed to upload avatar image");
  }

  if (data?.user) setCurrentUser(data.user);
  return data;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  role: "driver" | "passenger" = "passenger"
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    if (data?.token) setAuthToken(data.token);
    if (data?.user) setCurrentUser(data.user);
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
    if (data?.user) setCurrentUser(data.user);
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
};

