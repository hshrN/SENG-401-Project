/**
 * Infrastructure: auth API client (raw HTTP calls to backend).
 * Application layer uses this; UI must not call this directly.
 */

import type { LoginRequest, SignupRequest, AuthSuccessResponse } from "../../domain/types";
import { apiFetch } from "./client";

export async function loginRequest(data: LoginRequest): Promise<AuthSuccessResponse> {
  const response = await apiFetch("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Login failed");
  }
  return response.json();
}

export async function signupRequest(data: SignupRequest): Promise<AuthSuccessResponse> {
  const response = await apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Signup failed");
  }
  return response.json();
}
