import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Inbox from '../pages/Inbox';
import { AuthContext } from '../context/AuthContext';

const mockAuthContext = {
  user: { name: 'Test User', email: 'test@enterprise.com' },
  isAuthenticated: true,
  loading: false,
};

describe('Inbox Component Suite', () => {
  test('Renders Inbox page with controls', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Inbox />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Inbox|Search|Category|Emails/i)).toBeInTheDocument();
  });
});
