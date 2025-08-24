import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export const fetchServices = async () => {
  const res = await axios.get(`${API_URL}/services`);
  return res.data || [];
};

export const ensureUserExists = async (userId: number, name: string, phone: string) => {
  try {
    const existing = await axios.get(`${API_URL}/users/${userId}`).catch(() => null);

    if (!existing || !existing.data) {
      await axios.post(`${API_URL}/users`, {
        telegramId: String(userId),
        name,
        phone,
      });
    } else {
      await axios.put(`${API_URL}/users/${userId}`, {
        name,
        phone,
      });
    }
  } catch {
    throw new Error('User check/create/update failed');
  }
};

export const createAppointment = async (
  telegramId: number,
  name: string,
  phone: string,
  serviceId: number,
  startDate: Date,
  endDate: Date,
) => {
  return axios.post(`${API_URL}/appointments`, {
    telegramId,
    name,
    phone,
    serviceId,
    startDate,
    endDate,
  });
};

export const fetchAvailableSlots = async (serviceId: number) => {
  const res = await axios.get(`${API_URL}/appointments/available/${serviceId}`);
  return res.data;
};
