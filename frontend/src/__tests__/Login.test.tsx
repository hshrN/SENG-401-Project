import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// Mocks

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockLogin = jest.fn();
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock("../context/AudioContext", () => ({
  useAudio: () => ({ playSound: jest.fn() }),
}));

jest.mock("framer-motion", () => {
  const mockReact = require("react");
  return {
    motion: {
      div: ({ children, ...props }: any) =>
        mockReact.createElement("div", props, children),
      p: ({ children, ...props }: any) =>
        mockReact.createElement("p", props, children),
    },
    useInView: () => true,
    AnimatePresence: ({ children }: any) =>
      mockReact.createElement(mockReact.Fragment, null, children),
  };
});

jest.mock("../components/shared/GradientBackground", () => () => null);
jest.mock("../components/shared/GlobalNav", () => () => null);

// Component under test

import Login from "../pages/Login";

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

// Tests

/**
 * Testing strategy: requirement-based.
 *
 * Common case  → valid credentials submitted → login() called, navigate to "/".
 * Boundary case → username with surrounding whitespace → trimmed before calling login().
 * Error cases  → empty username, empty password, server-side rejection.
 */

describe("Login page", () => {
  beforeEach(() => jest.clearAllMocks());

  // Rendering

  it("renders username and password input fields", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders a link to the sign-up page", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
  });

  // Client-side validation (error cases)

  it("shows an error and does not call login() when username is empty", async () => {
    renderLogin();

    fireEvent.submit(
      screen.getByRole("button", { name: /log in/i }).closest("form")!,
    );

    expect(
      await screen.findByText("Please enter a username"),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows an error and does not call login() when password is empty", async () => {
    renderLogin();
    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");

    fireEvent.submit(
      screen.getByRole("button", { name: /log in/i }).closest("form")!,
    );

    expect(
      await screen.findByText("Please enter a password"),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // Common case

  it('calls login() and navigates to "/" on valid submission', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123",
    );
    fireEvent.submit(
      screen.getByRole("button", { name: /log in/i }).closest("form")!,
    );

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  // Boundary case

  it("trims surrounding whitespace from the username before calling login()", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    await userEvent.type(
      screen.getByPlaceholderText("Username"),
      "  testuser  ",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123",
    );
    fireEvent.submit(
      screen.getByRole("button", { name: /log in/i }).closest("form")!,
    );

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      }),
    );
  });

  // Server-side error

  it("displays the error message returned by the server when login fails", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid username or password"));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");
    await userEvent.type(screen.getByPlaceholderText("Password"), "wrongpass");
    fireEvent.submit(
      screen.getByRole("button", { name: /log in/i }).closest("form")!,
    );

    expect(
      await screen.findByText("Invalid username or password"),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // Password visibility toggle

  it("toggles the password field between hidden and visible when the eye button is clicked", () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText(
      "Password",
    ) as HTMLInputElement;

    // Default: password is hidden
    expect(passwordInput.type).toBe("password");

    // The eye-toggle is the first <button> in the DOM (inside the password input wrapper,
    // before the submit button)
    const [eyeToggle] = screen.getAllByRole("button");
    fireEvent.click(eyeToggle);

    expect(passwordInput.type).toBe("text");
  });
});
