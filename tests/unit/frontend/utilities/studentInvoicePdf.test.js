// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { saveSpy, textCalls } = vi.hoisted(() => ({
  saveSpy: vi.fn(),
  textCalls: [],
}));

vi.mock('../../../../frontend/node_modules/jspdf/dist/jspdf.node.min.js', async (importOriginal) => {
  const actual = await importOriginal();
  const RealJsPDF = actual.jsPDF;
  function WrappedJsPDF(...args) {
    const instance = new RealJsPDF(...args);
    const origText = instance.text.bind(instance);
    instance.text = (...tArgs) => {
      textCalls.push(tArgs);
      return origText(...tArgs);
    };
    instance.save = saveSpy;
    return instance;
  }
  return { ...actual, jsPDF: WrappedJsPDF };
});

import {
  buildStudentInvoicePdfDoc,
  sendInvoiceOnWhatsApp,
  sendInvoiceOnGmail,
  normalizeWhatsAppPhone,
} from '../../../../frontend/src/utils/studentInvoicePdf';

describe('studentInvoicePdf layout bounds + WhatsApp & Gmail receipt links', () => {
  const samplePayment = {
    id: 42,
    invoice_no: 'INV-20261111-124750-720',
    full_name: 'Afroz Khan Very Long Full Name Overflow Test',
    student_code: 'STD00011',
    mobile: '9876543210',
    email: 'afrozkhan.verylongemailaddressfortestingoverflow@gmail.com',
    amount_received: 1200,
    payment_date: '2026-11-11 12:48 PM',
    mode_name: 'UPI',
    plan_name: '2shift',
  };

  beforeEach(() => {
    saveSpy.mockReset();
    textCalls.length = 0;
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'open').mockImplementation(() => {});
    vi.spyOn(window, 'prompt').mockImplementation(() => '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps STATUS: and SUCCESSFUL strictly inside the metadata strip box right edge (<= 191mm inside 196mm box)', () => {
    const { doc } = buildStudentInvoicePdfDoc(samplePayment, {
      library_name: 'Central Library Main Campus Long Title Test',
    });

    const successfulCall = textCalls.find(([text]) => text === 'SUCCESSFUL');
    const statusLabelCall = textCalls.find(([text]) => text === 'STATUS:');

    expect(successfulCall).toBeDefined();
    expect(statusLabelCall).toBeDefined();
    expect(successfulCall[1]).toBeLessThanOrEqual(191);
    expect(successfulCall[3]).toMatchObject({ align: 'right' });
    expect(statusLabelCall[1]).toBeLessThan(successfulCall[1]);
    expect(statusLabelCall[3]).toMatchObject({ align: 'right' });

    const emailCall = textCalls.find(([text]) => String(text).includes('afrozkhan.'));
    expect(emailCall).toBeDefined();
    expect(doc.getTextWidth(emailCall[0])).toBeLessThanOrEqual(55);
  });

  it('formats 24-hour payment timestamps as 12-hour AM/PM on the PDF receipt', () => {
    buildStudentInvoicePdfDoc(
      { ...samplePayment, payment_date: '2026-11-11 14:30' },
      { library_name: 'Central Library' }
    );

    const timeCall = textCalls.find(([text]) => String(text).includes('02:30 PM'));
    expect(timeCall).toBeDefined();
    const raw24Call = textCalls.find(([text]) => String(text).includes('14:30'));
    expect(raw24Call).toBeUndefined();
  });

  it('normalizes WhatsApp phone numbers reliably', () => {
    expect(normalizeWhatsAppPhone('9876543210')).toBe('919876543210');
    expect(normalizeWhatsAppPhone('09876543210')).toBe('919876543210');
    expect(normalizeWhatsAppPhone('+91 98765-43210')).toBe('919876543210');
    expect(normalizeWhatsAppPhone('12345')).toBeNull();
  });

  it('sendInvoiceOnWhatsApp opens wa.me link for the student with formatted receipt text (no PDF download)', () => {
    const ok = sendInvoiceOnWhatsApp(samplePayment, '9876543210', {
      library_name: 'Central Library',
    });

    expect(ok).toBe(true);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledTimes(1);
    const [url, target, features] = window.open.mock.calls[0];
    expect(url.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    const decodedText = decodeURIComponent(url.split('?text=')[1]);
    expect(decodedText).toContain('INV-20261111-124750-720');
    expect(decodedText).toContain('FEE PAYMENT RECEIPT');
    expect(target).toBe('_blank');
    expect(features).toBe('noopener,noreferrer');
  });

  it('sendInvoiceOnGmail opens Gmail compose link for the student with receipt subject and body (no PDF download)', () => {
    const ok = sendInvoiceOnGmail(samplePayment, 'afrozkhan@gmail.com', {
      library_name: 'Central Library',
    });

    expect(ok).toBe(true);
    expect(saveSpy).not.toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledTimes(1);
    const [url, target, features] = window.open.mock.calls[0];
    expect(url).toContain('https://mail.google.com/mail/?view=cm&fs=1');
    expect(url).toContain('to=afrozkhan%40gmail.com');
    expect(url).toContain('su=');
    expect(url).toContain('&body=');
    expect(target).toBe('_blank');
    expect(features).toBe('noopener,noreferrer');
  });
});
