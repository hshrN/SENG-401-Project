/**
 * Application layer: auth use cases.
 * Orchestrates infrastructure (auth API); called by presentation (context, pages) only.
 */

import type { LoginRequest, SignupRequest, AuthSuccessResponse } from "../domain/types";
import { loginRequest as authApiLogin, signupRequest as authApiSignup } from "../infrastructure/api/authApi";

export type { LoginRequest, SignupRequest, User, AuthSuccessResponse } from "../domain/types";

export async function login(data: LoginRequest): Promise<AuthSuccessResponse> {
  return authApiLogin(data);
}

export async function signup(data: SignupRequest): Promise<AuthSuccessResponse> {
  return authApiSignup(data);
}
