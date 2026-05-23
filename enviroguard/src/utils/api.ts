import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_GATEWAY_URL;

async function getToken() {
  return await SecureStore.getItemAsync('jwt_token');
}

export async function apiGet<T = any>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getToken();
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${BASE}${path}${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export async function apiPost<T = any>(path: string, body: object): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export async function apiPut<T = any>(path: string, body: object): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}
