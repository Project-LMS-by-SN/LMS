import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'module';

if (!process.env.RESEND_API_KEY) process.env.RESEND_API_KEY = 're_test_dummy';

const require = createRequire(import.meta.url);
const dbPath = require.resolve('../../../../backend/src/config/db');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { connectDB: async () => ({}), getMongoUri: () => 'mongodb://127.0.0.1:27017/test' },
};

const mongoClient = require('../../../../backend/src/config/mongoClient');
const authUtil = require('../../../../backend/src/utils/auth');
const cache = require('../../../../backend/src/utils/cache');
const userController = require('../../../../backend/src/controllers/user.controller');

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn(),
});

describe('OTP-based Set / Forgot Password flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(mongoClient.securityEvent, 'create').mockResolvedValue({ id: 1 });
    vi.spyOn(cache, 'invalidateUser').mockImplementation(() => {});
  });

  afterEach(() => {
    userController._setResendClientForTest(undefined);
    vi.restoreAllMocks();
  });

  it('rejects empty or invalid email in forgotPassword with 400', async () => {
    const res1 = makeRes();
    await userController.forgotPassword({ body: { email: '' } }, res1);
    expect(res1.status).toHaveBeenCalledWith(400);

    const res2 = makeRes();
    await userController.forgotPassword({ body: { email: 'not-an-email' } }, res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });

  it('prevents user enumeration for unknown email', async () => {
    const originalEnvOwners = process.env.OWNER_EMAILS;
    process.env.OWNER_EMAILS = '';
    const sendSpy = vi.fn();
    userController._setResendClientForTest({ emails: { send: sendSpy } });
    vi.spyOn(mongoClient.user, 'findFirst').mockResolvedValue(null);

    const res = makeRes();
    await userController.forgotPassword({ body: { email: 'unknown@example.com' }, headers: {} }, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(sendSpy).not.toHaveBeenCalled();
    process.env.OWNER_EMAILS = originalEnvOwners;
  });

  it('completes full 3-step OTP flow: forgotPassword -> verifyResetOtp -> GET/POST resetPassword', async () => {
    let userRecord = {
      id: 42,
      name: 'Library Owner',
      email: 'owner@example.com',
      role: 'OWNER',
      isActive: true,
      mustChangePassword: true,
      passwordHash: authUtil.hashPassword('oldpass1'),
      passwordResetOtpHash: null,
      passwordResetOtpExpiry: null,
      passwordResetOtpAttempts: 0,
      passwordResetToken: null,
      passwordResetExpiry: null,
    };

    let capturedHtml = '';
    const sendSpy = vi.fn().mockImplementation(async (payload) => {
      capturedHtml = payload.html;
      return { data: { id: 'email_123' }, error: null };
    });
    userController._setResendClientForTest({ emails: { send: sendSpy } });

    vi.spyOn(mongoClient.user, 'findFirst').mockImplementation(async ({ where }) => {
      if (where.email && where.email === userRecord.email && where.deletedAt === null) {
        if (where.isActive !== undefined && userRecord.isActive !== where.isActive) return null;
        return { ...userRecord };
      }
      if (where.passwordResetToken && where.passwordResetToken === userRecord.passwordResetToken) {
        if (userRecord.passwordResetExpiry && userRecord.passwordResetExpiry > where.passwordResetExpiry.gt) {
          return { ...userRecord };
        }
        return null;
      }
      return null;
    });

    vi.spyOn(mongoClient.user, 'update').mockImplementation(async ({ data }) => {
      userRecord = { ...userRecord, ...data };
      return { ...userRecord };
    });
    vi.spyOn(mongoClient.userSession, 'updateMany').mockResolvedValue({ count: 1 });

    // Step 1: Request 6-digit OTP
    const forgotRes = makeRes();
    await userController.forgotPassword(
      { body: { email: 'OWNER@example.com' }, headers: {} },
      forgotRes
    );

    expect(forgotRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(sendSpy).toHaveBeenCalledTimes(1);
    const otpMatch = capturedHtml.match(/>\s*(\d{6})\s*</);
    expect(otpMatch).not.toBeNull();
    const sentOtp = otpMatch[1];

    expect(userRecord.passwordResetOtpHash).toBeTruthy();
    expect(userRecord.passwordResetOtpHash).not.toBe(sentOtp);

    // Step 2a: Wrong OTP increments attempts and returns 400
    const badOtp = sentOtp === '111111' ? '222222' : '111111';
    const wrongOtpRes = makeRes();
    await userController.verifyResetOtp(
      { body: { email: 'owner@example.com', otp: badOtp }, headers: {} },
      wrongOtpRes
    );
    expect(wrongOtpRes.status).toHaveBeenCalledWith(400);
    expect(userRecord.passwordResetOtpAttempts).toBe(1);

    // Step 2b: Valid OTP issues resetToken and invalidates OTP
    const verifyRes = makeRes();
    await userController.verifyResetOtp(
      { body: { email: 'owner@example.com', otp: sentOtp }, headers: {} },
      verifyRes
    );
    const verifyBody = verifyRes.json.mock.calls[0][0];
    expect(verifyBody.success).toBe(true);
    expect(verifyBody.resetToken).toBeTruthy();
    expect(userRecord.passwordResetOtpHash).toBeNull();
    expect(userRecord.passwordResetToken).toBe(authUtil.hashResetToken(verifyBody.resetToken));

    // Step 3a: GET validates session without consuming it
    const getRes = makeRes();
    await userController.resetPassword(
      { method: 'GET', query: { token: verifyBody.resetToken }, body: {} },
      getRes
    );
    expect(getRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, valid: true, email: 'owner@example.com' })
    );

    // Step 3b: POST sets new password and revokes reset token
    const postRes = makeRes();
    await userController.resetPassword(
      { method: 'POST', query: {}, body: { token: verifyBody.resetToken, password: 'NewPassword99' }, headers: {} },
      postRes
    );
    expect(postRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(userRecord.mustChangePassword).toBe(false);
    expect(userRecord.passwordResetToken).toBeNull();
    expect(authUtil.comparePassword('NewPassword99', userRecord.passwordHash)).toBe(true);

    // Step 3c: Token cannot be reused
    const replayRes = makeRes();
    await userController.resetPassword(
      { method: 'POST', query: {}, body: { token: verifyBody.resetToken, password: 'AnotherPass99' }, headers: {} },
      replayRes
    );
    expect(replayRes.status).toHaveBeenCalledWith(400);
  });

  it('rolls back OTP if Resend returns an error object', async () => {
    let userRecord = {
      id: 43,
      name: 'Owner',
      email: 'fail@example.com',
      role: 'OWNER',
      isActive: true,
    };

    userController._setResendClientForTest({
      emails: { send: vi.fn().mockResolvedValue({ data: null, error: { message: 'Invalid domain' } }) },
    });
    vi.spyOn(mongoClient.user, 'findFirst').mockResolvedValue(userRecord);
    vi.spyOn(mongoClient.user, 'update').mockImplementation(async ({ data }) => {
      userRecord = { ...userRecord, ...data };
      return { ...userRecord };
    });

    const res = makeRes();
    await userController.forgotPassword({ body: { email: 'fail@example.com' }, headers: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(userRecord.passwordResetOtpHash).toBeNull();
    expect(userRecord.passwordResetOtpExpiry).toBeNull();
  });
});

