export type LoginRequest = {
  username: string;
  password: string;
}

export type SignupRequest = {
  username: string;
  password: string;
  confirmPassword: string;
}

export type User = {
  id: number;
  username: string;
}

export type AuthSuccessResponse = {
  user: User;
}

export async function loginRequest(data: LoginRequest): Promise<AuthSuccessResponse> {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}

export async function signupRequest(data: SignupRequest): Promise<AuthSuccessResponse> {
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}