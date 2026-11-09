/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import NotificationBell from '../../../../frontend/src/components/NotificationBell';

// Mock api call
vi.mock('../../../../frontend/src/api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
  },
}));

describe('NotificationBell component unit tests', () => {
  it('renders notification bell icon container', () => {
    const { container } = render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const bell = container.querySelector('.notification-bell');
    expect(bell).toBeInTheDocument();
    expect(container.querySelector('.bell-icon')).toBeInTheDocument();
  });
});
