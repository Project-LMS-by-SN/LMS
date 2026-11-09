/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../../../../frontend/src/context/ThemeContext';

describe('useTheme hook unit tests', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.body.className = '';
  });

  it('provides default light mode and 12hr format', () => {
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.darkMode).toBe(false);
    expect(result.current.timeFormat).toBe('12hr');
  });

  it('toggles dark mode and updates localStorage', () => {
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(true);
    expect(localStorage.getItem('lms_dark_mode')).toBe('true');
  });

  it('toggles time format between 12hr and 24hr', () => {
    const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.toggleTimeFormat();
    });

    expect(result.current.timeFormat).toBe('24hr');
    expect(localStorage.getItem('lms_time_format')).toBe('24hr');

    act(() => {
      result.current.toggleTimeFormat();
    });

    expect(result.current.timeFormat).toBe('12hr');
  });
});
