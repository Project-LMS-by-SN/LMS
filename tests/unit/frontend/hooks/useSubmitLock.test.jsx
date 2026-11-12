/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { useSubmitLock } from '../../../../frontend/src/hooks/useSubmitLock';

function TestFormButton({ onAction }) {
  const { isSubmitting, runWithLock } = useSubmitLock();
  return (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={() => runWithLock(onAction)}
    >
      {isSubmitting ? 'Saving...' : 'Save Shift'}
    </button>
  );
}

describe('useSubmitLock double-click protection', () => {
  afterEach(() => {
    cleanup();
  });

  it('executes async action only once when button is double-clicked rapidly', async () => {
    let resolvePending;
    const action = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePending = () => resolve('created');
        })
    );

    render(<TestFormButton onAction={action} />);
    const btn = screen.getByRole('button', { name: 'Save Shift' });

    // Rapid same-tick double click (before React even paints disabled state)
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(action).toHaveBeenCalledTimes(1);
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Saving...');

    resolvePending();

    await waitFor(() => {
      expect(btn).not.toBeDisabled();
      expect(btn).toHaveTextContent('Save Shift');
    });

    // After completion, an intentional subsequent click works normally
    fireEvent.click(btn);
    expect(action).toHaveBeenCalledTimes(2);
    resolvePending();

    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });
  });

  it('unlocks safely even if the async action rejects', async () => {
    const failingAction = vi.fn().mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce('ok');

    function ErrorSafeButton() {
      const { isSubmitting, runWithLock } = useSubmitLock();
      return (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => runWithLock(failingAction).catch(() => {})}
        >
          {isSubmitting ? 'Saving...' : 'Submit'}
        </button>
      );
    }

    render(<ErrorSafeButton />);
    const btn = screen.getByRole('button', { name: 'Submit' });

    fireEvent.click(btn);
    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });

    fireEvent.click(btn);
    await waitFor(() => {
      expect(failingAction).toHaveBeenCalledTimes(2);
    });
  });
});
