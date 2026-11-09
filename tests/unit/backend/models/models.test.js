import { describe, it, expect } from 'vitest';
import models from '../../../../backend/src/models';

describe('backend models unit tests', () => {
  it('registers all core LMS models', () => {
    const expectedModels = [
      'Branch',
      'User',
      'UserSession',
      'Student',
      'FeePlan',
      'Seat',
      'Shift',
      'StudentValidity',
      'Payment',
      'PaymentMode',
      'Attendance',
      'Expense',
      'SupportTicket',
    ];

    expectedModels.forEach((modelName) => {
      expect(models[modelName]).toBeDefined();
      expect(typeof models[modelName]).toBe('function');
    });
  });

  it('validates Branch schema attributes', () => {
    const branchSchema = models.Branch.schema;
    expect(branchSchema.paths.id).toBeDefined();
    expect(branchSchema.paths.name).toBeDefined();
    expect(branchSchema.paths.code).toBeDefined();
    expect(branchSchema.paths.isActive).toBeDefined();
  });

  it('validates Student schema attributes', () => {
    const studentSchema = models.Student.schema;
    expect(studentSchema.paths.id).toBeDefined();
    expect(studentSchema.paths.fullName).toBeDefined();
    expect(studentSchema.paths.email).toBeDefined();
    expect(studentSchema.paths.studentCode).toBeDefined();
    expect(studentSchema.paths.branchId).toBeDefined();
  });

  it('validates SupportTicket schema attributes', () => {
    const ticketSchema = models.SupportTicket.schema;
    expect(ticketSchema.paths.name).toBeDefined();
    expect(ticketSchema.paths.phone).toBeDefined();
    expect(ticketSchema.paths.message).toBeDefined();
    expect(ticketSchema.paths.status).toBeDefined();
  });
});
