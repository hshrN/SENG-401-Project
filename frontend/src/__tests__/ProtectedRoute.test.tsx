import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const mockUseAuth = useAuth as jest.Mock;

// ── Helpers ────────────────────────────────────────────────────────────────

const ChildPage = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

/**
 * Render a ProtectedRoute wrapping <ChildPage />.
 * The /login route is included so <Navigate to="/login" /> has somewhere to resolve.
 */
const renderWithRouter = (initialEntry = '/protected') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <ChildPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

// ── Tests ──────────────────────────────────────────────────────────────────

/**
 * Testing strategy: requirement-based.
 *
 * Common case  → authenticated user sees the protected content.
 * Boundary case → auth state is still loading (isLoading: true).
 * Error case   → unauthenticated user is redirected to /login.
 */

describe('ProtectedRoute', () => {
  it('renders a loading indicator while auth state is being resolved', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false, isLoading: true });
    renderWithRouter();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects to /login when the user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: false, isLoading: false });
    renderWithRouter();

    // <Navigate replace to="/login" /> swaps the route, so the Login page renders
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders the protected child when the user is authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoggedIn: true, isLoading: false });
    renderWithRouter();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
