import { describe, it, expect, vi } from 'vitest';
import { createSupportTicket } from '../../../../backend/src/controllers/support.controller';

describe('support.controller unit tests', () => {
  it('rejects empty message with 400', async () => {
    const req = {
      body: { name: 'Manish', phone: '9999999999', message: '' },
      user: { id: 1, branchId: 1 },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Please enter a description for your issue or inquiry.',
      })
    );
  });

  it('rejects empty name with 400', async () => {
    const req = {
      body: { name: '', phone: '9999999999', message: 'Test message' },
      user: { id: 1, branchId: 1 },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Please provide your name or library name.',
      })
    );
  });

  it('rejects empty phone with 400', async () => {
    const req = {
      body: { name: 'Library Admin', phone: '', message: 'Test message' },
      user: { id: 1, branchId: 1 },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await createSupportTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Please provide your contact phone number.',
      })
    );
  });
});
