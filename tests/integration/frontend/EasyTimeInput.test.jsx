/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import EasyTimeInput from '../../../frontend/src/components/EasyTimeInput';

describe('EasyTimeInput frontend integration tests', () => {
  it('renders hour, minute, and period buttons correctly', () => {
    const handleChange = vi.fn();
    render(
      <EasyTimeInput
        label="Shift Start Time"
        value="14:30"
        onChange={handleChange}
        id="shift-start"
      />
    );

    expect(screen.getByText('Shift Start Time')).toBeInTheDocument();
    expect(screen.getByDisplayValue('02')).toBeInTheDocument(); // 14:00 is 02 PM
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();
  });

  it('triggers onChange when hour is changed', () => {
    const handleChange = vi.fn();
    render(
      <EasyTimeInput
        label="Shift Start Time"
        value="09:00"
        onChange={handleChange}
        id="shift-start"
      />
    );

    const hourSelect = screen.getByDisplayValue('09');
    fireEvent.change(hourSelect, { target: { value: '10' } });

    expect(handleChange).toHaveBeenCalledWith('10:00');
  });

  it('triggers onChange when period button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <EasyTimeInput
        label="Shift Start Time"
        value="09:00"
        onChange={handleChange}
        id="shift-start"
      />
    );

    const pmBtn = screen.getByText('PM');
    fireEvent.click(pmBtn);

    expect(handleChange).toHaveBeenCalledWith('21:00');
  });
});
