/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ExpiryModal from '../../../../frontend/src/components/ExpiryModal';

describe('ExpiryModal unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('suppresses the 7-day expiry warning modal when future plan (pendingTier) is booked', () => {
    const expirySoon = new Date();
    expirySoon.setDate(expirySoon.getDate() + 3);

    localStorage.setItem('lms_user', JSON.stringify({
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expirySoon.toISOString(),
      pendingTier: 'PRO',
      pendingExpiryDays: 30,
    }));

    const { container } = render(
      <MemoryRouter>
        <ExpiryModal />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders expiring soon warning with Renew Now button when no future plan is booked', () => {
    const expirySoon = new Date();
    expirySoon.setDate(expirySoon.getDate() + 4);

    localStorage.setItem('lms_user', JSON.stringify({
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expirySoon.toISOString(),
      pendingTier: null,
    }));

    render(
      <MemoryRouter>
        <ExpiryModal />
      </MemoryRouter>
    );

    expect(screen.getByText('Subscription Expiring Soon!')).toBeInTheDocument();
    expect(screen.getByText(/expires in 4 days/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /renew now/i })).toBeInTheDocument();
  });

  it('renders expired modal for OWNER with Renew Now button', () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 2);

    localStorage.setItem('lms_user', JSON.stringify({
      role: 'OWNER',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate.toISOString(),
      pendingTier: null,
    }));

    render(
      <MemoryRouter>
        <ExpiryModal />
      </MemoryRouter>
    );

    expect(screen.getByText('Subscription Expired!')).toBeInTheDocument();
    expect(screen.getByText(/Your plan has expired. Renew now to continue using all features./i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /renew now/i })).toBeInTheDocument();
  });

  it('renders expired modal for STAFF with locked message and Close button, but NO Renew Now button', () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 2);

    localStorage.setItem('lms_user', JSON.stringify({
      role: 'STAFF',
      subscriptionTier: 'BASIC',
      subscriptionExpiry: expiredDate.toISOString(),
      pendingTier: null,
    }));

    render(
      <MemoryRouter>
        <ExpiryModal />
      </MemoryRouter>
    );

    expect(screen.getByText('Subscription Expired!')).toBeInTheDocument();
    expect(screen.getByText(/Your library's subscription has expired. All operations are locked. Please contact the library owner to renew./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /renew now/i })).toBeNull();
  });
});

