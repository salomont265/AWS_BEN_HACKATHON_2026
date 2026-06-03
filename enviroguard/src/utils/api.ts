/**
 * API Client - Real backend integration
 * Base URL: https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2
 */

import * as storage from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_GATEWAY_URL || 'https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2';

async function getToken(): Promise<string | null> {
  return await storage.getItem('jwt_token');
}

export async function getUserId(): Promise<string | null> {
  return await storage.getItem('user_id');
}

export async function apiGet<T = any>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const token = await getToken();
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const url = `${BASE_URL}${path}${qs}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    console.error('apiGet ERROR:', { url, status: res.status, text });
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}

export async function apiPost<T = any>(
  path: string,
  body: object
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}

export async function apiPut<T = any>(
  path: string,
  body: object
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}

export async function apiDelete<T = any>(
  path: string
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json();
}

// Auth helpers
export async function saveAuthToken(token: string, userId: string) {
  await storage.setItem('jwt_token', token);
  await storage.setItem('user_id', userId);
}

export async function clearAuthToken() {
  await storage.deleteItem('jwt_token');
  await storage.deleteItem('user_id');
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
