import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthContext } from '../context/AuthContext';

const mockAuthContext = {
  user: { name: 'Test User', email: 'test@enterprise.com' },
  isAuthenticated: true,
  loading: false,
};

describe('Dashboard Component Suite', () => {
  test('Renders Dashboard page without crashing', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Dashboard|Overview|Emails|Activity/i)).toBeInTheDocument();
  });
});
