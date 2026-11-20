/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../../../frontend/src/layouts/DashboardLayout';

vi.mock('../../../../frontend/src/context/ThemeContext', () => ({
  useTheme: () => ({ darkMode: false }),
}));

vi.mock('../../../../frontend/src/api/axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

vi.mock('../../../../frontend/src/components/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell">NotificationBell</div>,
}));

vi.mock('../../../../frontend/src/components/ExpiryModal', () => ({
  default: () => <div data-testid="expiry-modal">ExpiryModal</div>,
}));

describe('DashboardLayout Expiry & Staff Lock Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('locks operational routes and renders Subscription Expired notice for STAFF', () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 3);

    localStorage.setItem('lms_token', 'mock_token');
    localStorage.setItem('lms_user', JSON.stringify({
      id: 5,
      name: 'Rohan Sharma',
      role: 'STAFF',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate.toISOString(),
      pendingTier: null,
    }));

    render(
      <MemoryRouter initialEntries={['/staff/rohan-sharma/attendance']}>
        <Routes>
          <Route path="/:role/:name/*" element={<DashboardLayout />}>
            <Route path="attendance" element={<div>Real Attendance Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Operational route should NOT render the actual attendance page content
    expect(screen.queryByText('Real Attendance Content')).toBeNull();

    // Instead, it should render the clean English locked screen
    expect(screen.getByRole('heading', { name: 'Subscription Expired' })).toBeInTheDocument();
    expect(
      screen.getByText(/Your library's subscription has expired. All operations and management modules are temporarily locked. Please contact your library administrator or owner to renew the subscription./i)
    ).toBeInTheDocument();

    // Staff should have "Back to Dashboard" but NOT "Renew Subscription" button
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /renew subscription/i })).toBeNull();
  });

  it('locks operational routes and renders Renew Subscription button for OWNER', () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 3);

    localStorage.setItem('lms_token', 'mock_token');
    localStorage.setItem('lms_user', JSON.stringify({
      id: 1,
      name: 'Admin Owner',
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate.toISOString(),
      pendingTier: null,
    }));

    render(
      <MemoryRouter initialEntries={['/owner/admin-owner/students']}>
        <Routes>
          <Route path="/:role/:name/*" element={<DashboardLayout />}>
            <Route path="students" element={<div>Real Students Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Real Students Content')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Subscription Expired' })).toBeInTheDocument();
    expect(
      screen.getByText(/Your subscription plan has expired. To access this module and resume library operations, please renew your subscription./i)
    ).toBeInTheDocument();

    // Owner should have both "Renew Subscription" and "Back to Dashboard"
    expect(screen.getByRole('link', { name: /renew subscription/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to dashboard/i })).toBeInTheDocument();
  });

  it('disables Attendance, Admission, and Collect Fee sidebar links when expired', () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 3);

    localStorage.setItem('lms_token', 'mock_token');
    localStorage.setItem('lms_user', JSON.stringify({
      id: 5,
      name: 'Rohan Sharma',
      role: 'STAFF',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate.toISOString(),
      pendingTier: null,
    }));

    const { container } = render(
      <MemoryRouter initialEntries={['/staff/rohan-sharma/dashboard']}>
        <Routes>
          <Route path="/:role/:name/*" element={<DashboardLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Dashboard itself is allowed
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();

    // Check disabled links in the sidebar
    const disabledLinks = container.querySelectorAll('.sidebar-disabled-link');
    const disabledTexts = Array.from(disabledLinks).map((el) => el.textContent);

    expect(disabledTexts.some((t) => t.includes('Attendance'))).toBe(true);
    expect(disabledTexts.some((t) => t.includes('Admission'))).toBe(true);
    expect(disabledTexts.some((t) => t.includes('Collect Fee'))).toBe(true);
    expect(disabledTexts.some((t) => t.includes('Students'))).toBe(true);
    expect(disabledTexts.some((t) => t.includes('Seat Layout'))).toBe(true);
  });
});

