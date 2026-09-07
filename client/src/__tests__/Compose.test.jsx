import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Compose from '../pages/Compose';
import { AuthContext } from '../context/AuthContext';

const mockAuthContext = {
  user: { name: 'Test User', email: 'test@enterprise.com' },
  isAuthenticated: true,
  loading: false,
};

describe('Compose Component Suite', () => {
  test('Renders Compose form', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Compose />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Compose|New Email|Recipient|To|Subject/i)).toBeInTheDocument();
  });
});
