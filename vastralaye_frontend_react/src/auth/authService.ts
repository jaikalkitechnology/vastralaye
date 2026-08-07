import axios from 'axios';
import { BASE_URL } from '../config';
import { User } from '@/types';
import { toast } from 'sonner';

// ✅ Login function
export const login = async (email: string, password: string): Promise<User> => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await axios.post<{ access_token: string }>(`${BASE_URL}/users/login`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const token = response.data.access_token;
  if (!token) throw new Error("Token not received");

  const userResponse = await axios.get<User>(`${BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const user = userResponse.data;
  const currentUser = { ...user, token };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  return currentUser;
};


// ✅ Register function
export const register = async (
  first_name: string,
  last_name: string,
  email: string,
  password: string
): Promise<void> => {
  try {
    const response = await axios.post<{ message: string }>(`${BASE_URL}/users/signUp`, {
      first_name,
      last_name,
      email,
      password,
    });
    toast.success(response.data.message);
  } catch (error: any) {
    const message = error?.response?.data?.detail || 'Registration failed';
    toast.error(message);
    throw new Error(message);
  }
};

// ✅ Logout function
export const logout = (): void => {
  localStorage.removeItem('currentUser');
  delete axios.defaults.headers.common['Authorization'];
};
