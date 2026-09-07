import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Tasks from '../pages/Tasks';
import { AuthContext } from '../context/AuthContext';

const mockAuthContext = {
  user: { name: 'Test User', email: 'test@enterprise.com' },
  isAuthenticated: true,
  loading: false,
};

describe('Tasks Component Suite', () => {
  test('Renders Tasks page container', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Tasks />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Tasks|Action Items|Pending|Completed/i)).toBeInTheDocument();
  });
});
