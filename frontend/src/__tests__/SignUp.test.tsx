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

const mockSignup = jest.fn();
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ signup: mockSignup }),
}));

jest.mock("../context/AudioContext", () => ({
  useAudio: () => ({ playSound: jest.fn() }),
}));

jest.mock("framer-motion", () => {
  // require('react') is used instead of the imported React because jest.mock()
  // factories are hoisted before imports, so the React binding is not yet in scope.
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

import SignUp from "../pages/SignUp";

const renderSignUp = () =>
  render(
    <MemoryRouter>
      <SignUp />
    </MemoryRouter>,
  );

/** Submit the sign-up form via the submit button. */
const submitForm = () =>
  fireEvent.submit(
    screen.getByRole("button", { name: /sign up/i }).closest("form")!,
  );

// Tests

/**
 * Testing strategy: requirement-based.
 *
 * Common case  → all fields valid → signup() called with correct data, navigate to "/".
 * Boundary case → username with surrounding whitespace → trimmed before calling signup().
 * Error cases  → empty username, empty password, missing confirm password,
 *                mismatched passwords, server-side rejection.
 */

describe("SignUp page", () => {
  beforeEach(() => jest.clearAllMocks());

  // Rendering

  it("renders username, password, and confirm-password input fields", () => {
    renderSignUp();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm password")).toBeInTheDocument();
  });

  it("renders a link to the login page", () => {
    renderSignUp();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });

  // Client-side validation (error cases)

  it("shows an error and does not call signup() when username is empty", async () => {
    renderSignUp();

    submitForm();

    expect(
      await screen.findByText("Please enter a username"),
    ).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("shows an error and does not call signup() when password is empty", async () => {
    renderSignUp();
    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");

    submitForm();

    expect(
      await screen.findByText("Please enter a password"),
    ).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("shows an error and does not call signup() when confirm password is empty", async () => {
    renderSignUp();
    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");

    submitForm();

    expect(
      await screen.findByText("Please confirm your password"),
    ).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("shows an error and does not call signup() when passwords do not match", async () => {
    renderSignUp();
    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "different",
    );

    submitForm();

    expect(
      await screen.findByText("Passwords do not match"),
    ).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  // Common case

  it("calls signup() with correct data and navigates to '/' on valid submission", async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    renderSignUp();

    await userEvent.type(screen.getByPlaceholderText("Username"), "newuser");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "secret123",
    );

    submitForm();

    await waitFor(() =>
      expect(mockSignup).toHaveBeenCalledWith({
        username: "newuser",
        password: "secret123",
        confirmPassword: "secret123",
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  // Boundary case

  it("trims surrounding whitespace from the username before calling signup()", async () => {
    mockSignup.mockResolvedValueOnce(undefined);
    renderSignUp();

    await userEvent.type(
      screen.getByPlaceholderText("Username"),
      "  newuser  ",
    );
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "secret123",
    );

    submitForm();

    await waitFor(() =>
      expect(mockSignup).toHaveBeenCalledWith({
        username: "newuser",
        password: "secret123",
        confirmPassword: "secret123",
      }),
    );
  });

  // Server-side error

  it("displays the error message returned by the server when signup fails", async () => {
    mockSignup.mockRejectedValueOnce(new Error("Username already exists"));
    renderSignUp();

    await userEvent.type(screen.getByPlaceholderText("Username"), "takenuser");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");
    await userEvent.type(
      screen.getByPlaceholderText("Confirm password"),
      "secret123",
    );

    submitForm();

    expect(
      await screen.findByText("Username already exists"),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
