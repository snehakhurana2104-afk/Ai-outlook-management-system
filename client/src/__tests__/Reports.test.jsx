import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Reports from '../pages/Reports';

describe('Reports Component Suite', () => {
  test('Renders Reports page with export controls', () => {
    render(
      <BrowserRouter>
        <Reports />
      </BrowserRouter>
    );

    expect(screen.getByText(/Reports|Export|PDF|Excel/i)).toBeInTheDocument();
  });
});
