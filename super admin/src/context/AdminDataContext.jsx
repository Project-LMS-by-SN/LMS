import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const AdminDataContext = createContext();
const STORAGE_KEY = "lms_standalone_admin_data_v3";

const INITIAL_LIBRARIES = [
  {
    id: "lib-1",
    name: "Apex Study & Reading Lounge",
    code: "LIB-DEL-01",
    owner_name: "Rahul Sharma",
    phone: "9876543210",
    email: "apex.delhi@gmail.com",
    city: "New Delhi",
    address: "B-12, Laxmi Nagar, Metro Pillar 34",
    total_seats: 120,
    active_students_limit: 150,
    subscription_tier: "PRO_200",
    subscription_status: "ACTIVE",
    subscription_cycle: "Yearly",
    subscription_start: "2025-01-10",
    subscription_expiry: "2026-01-10",
    razorpay_sub_id: "sub_Rzp910284729",
    razorpay_payment_id: "pay_Op982347102",
    last_amount_paid: 15999,
    razorpay_status: "VERIFIED",
    auto_debit: true,
    status: "ACTIVE",
    created_at: "2024-03-15",
  },
  {
    id: "lib-2",
    name: "Central Library Hub",
    code: "LIB-PAT-02",
    owner_name: "Amit Kumar Verma",
    phone: "9123456789",
    email: "centrallib.patna@gmail.com",
    city: "Patna",
    address: "Ashok Rajpath, Near Science College",
    total_seats: 80,
    active_students_limit: 100,
    subscription_tier: "PRO_100",
    subscription_status: "ACTIVE",
    subscription_cycle: "Monthly",
    subscription_start: "2025-02-01",
    subscription_expiry: "2025-03-01",
    razorpay_sub_id: "sub_Rzp827104928",
    razorpay_payment_id: "pay_Np481920391",
    last_amount_paid: 999,
    razorpay_status: "VERIFIED",
    auto_debit: true,
    status: "ACTIVE",
    created_at: "2024-06-20",
  },
  {
    id: "lib-3",
    name: "Scholar's Den 24/7",
    code: "LIB-JAI-03",
    owner_name: "Pooja Choudhary",
    phone: "9829012345",
    email: "scholarsden.jaipur@gmail.com",
    city: "Jaipur",
    address: "Plot 45, Gopalpura Bypass",
    total_seats: 150,
    active_students_limit: 200,
    subscription_tier: "ENTERPRISE",
    subscription_status: "ACTIVE",
    subscription_cycle: "Yearly",
    subscription_start: "2024-11-15",
    subscription_expiry: "2025-11-15",
    razorpay_sub_id: "sub_Rzp748291038",
    razorpay_payment_id: "pay_Jp739102847",
    last_amount_paid: 29999,
    razorpay_status: "VERIFIED",
    auto_debit: true,
    status: "ACTIVE",
    created_at: "2023-11-15",
  },
  {
    id: "lib-4",
    name: "Success Point Self Study",
    code: "LIB-LKO-04",
    owner_name: "Vikas Srivastava",
    phone: "9450123987",
    email: "successpoint.lko@gmail.com",
    city: "Lucknow",
    address: "Aliganj Sector H, Near Kapoorthala",
    total_seats: 50,
    active_students_limit: 60,
    subscription_tier: "STARTER",
    subscription_status: "EXPIRING_SOON",
    subscription_cycle: "Monthly",
    subscription_start: "2025-01-28",
    subscription_expiry: "2025-02-28",
    razorpay_sub_id: "sub_Rzp639102948",
    razorpay_payment_id: "pay_Lp839201948",
    last_amount_paid: 499,
    razorpay_status: "VERIFIED",
    auto_debit: true,
    status: "ACTIVE",
    created_at: "2024-09-01",
  },
  {
    id: "lib-5",
    name: "Horizon Peaceful Library",
    code: "LIB-MUM-05",
    owner_name: "Sunil Deshmukh",
    phone: "9702112233",
    email: "horizonlib.mumbai@gmail.com",
    city: "Navi Mumbai",
    address: "Sector 17, Vashi Plaza",
    total_seats: 90,
    active_students_limit: 100,
    subscription_tier: "PRO_100",
    subscription_status: "EXPIRED",
    subscription_cycle: "Monthly",
    subscription_start: "2024-12-01",
    subscription_expiry: "2025-01-01",
    razorpay_sub_id: "sub_Rzp528192039",
    razorpay_payment_id: "pay_Kp928103948",
    last_amount_paid: 999,
    razorpay_status: "FAILED_AUTOPAY",
    auto_debit: false,
    status: "SUSPENDED",
    created_at: "2024-05-10",
  },
];

// In LMS Subscription Plans, there is NO seat limit (Unlimited Seats)
const INITIAL_FEE_PLANS = [
  {
    id: "plan-starter",
    tier_key: "STARTER",
    name: "Starter Plan",
    monthly_price: 499,
    annual_price: 4999,
    seat_limit: "Unlimited", // No seat restriction
    discount_percent: 15,
    description: "Ideal for small independent libraries getting started with zero seat restrictions.",
    features: [
      "Unlimited Seats & Flexible Desks",
      "QR Code Live Attendance",
      "Basic Student Profiles & Validities",
      "WhatsApp Fee Due Reminders",
      "Standard Email Support",
    ],
    is_active: true,
    badge: "No Seat Limit",
  },
  {
    id: "plan-pro-100",
    tier_key: "PRO_100",
    name: "Basic Pro Plan",
    monthly_price: 999,
    annual_price: 9999,
    seat_limit: "Unlimited",
    discount_percent: 20,
    description: "Designed for active libraries with shift management and analytics.",
    features: [
      "Unlimited Seats & All Shift Management",
      "Live Real-time Seat Occupancy Grid",
      "Custom Fee Plans & Invoicing",
      "Student Reports & Excel Exports",
      "Daily Attendance Alerts",
      "Priority WhatsApp Support",
    ],
    is_active: true,
    badge: "Most Popular",
  },
  {
    id: "plan-pro-200",
    tier_key: "PRO_200",
    name: "Pro Advanced Plan",
    monthly_price: 1599,
    annual_price: 15999,
    seat_limit: "Unlimited",
    discount_percent: 25,
    description: "Power-packed for large multi-shift branches with complete automation.",
    features: [
      "Unlimited Seats & Multi-Shifts",
      "Automatic Payment Reconciliation",
      "Student Validity Tracker & Expiry Alerts",
      "Expense & Revenue Analysis Dashboard",
      "Public Admission QR Landing Page",
      "24/7 Dedicated Support",
    ],
    is_active: true,
    badge: "Best Value",
  },
  {
    id: "plan-enterprise",
    tier_key: "ENTERPRISE",
    name: "Enterprise Multi-Branch Plan",
    monthly_price: 2999,
    annual_price: 29999,
    seat_limit: "Unlimited",
    discount_percent: 30,
    description: "Unlimited power for library chains & multi-city study centers.",
    features: [
      "Unlimited Seats Across All Branches",
      "Multi-Branch Central Management",
      "Custom Domain & Branding Integration",
      "Automated WhatsApp Gateway Access",
      "Personal Account Manager & SLA",
      "Full API & Webhook Access",
    ],
    is_active: true,
    badge: "Enterprise",
  },
];

const INITIAL_COUPONS = [
  {
    id: "coup-1",
    code: "WELCOME50",
    discount_type: "PERCENT",
    discount_value: 50,
    min_order: 499,
    max_discount: 1000,
    expiry_date: "2026-12-31",
    applicable_tier: "ALL",
    usage_count: 48,
    usage_limit: 100,
    is_active: true,
    description: "50% off up to ₹1,000 for new libraries onboarding",
  },
  {
    id: "coup-2",
    code: "PRO1",
    discount_type: "FLAT",
    discount_value: 998,
    min_order: 999,
    max_discount: 998,
    expiry_date: "2026-06-30",
    applicable_tier: "PRO_100",
    usage_count: 85,
    usage_limit: 100,
    is_active: true,
    description: "Special ₹1 Pro Trial Promo Code",
  },
  {
    id: "coup-3",
    code: "ANNUAL25",
    discount_type: "PERCENT",
    discount_value: 25,
    min_order: 4999,
    max_discount: 4000,
    expiry_date: "2026-12-31",
    applicable_tier: "ALL",
    usage_count: 19,
    usage_limit: 50,
    is_active: true,
    description: "25% discount on all annual subscription plans",
  },
  {
    id: "coup-4",
    code: "FESTIVE500",
    discount_type: "FLAT",
    discount_value: 500,
    min_order: 1500,
    max_discount: 500,
    expiry_date: "2025-10-31",
    applicable_tier: "PRO_200",
    usage_count: 50,
    usage_limit: 50,
    is_active: false,
    description: "Flat ₹500 off on Pro 200 plan (Expired)",
  },
];

const INITIAL_STUDENTS = [
  // Apex Study (LIB-DEL-01)
  {
    id: "stu-1",
    name: "Aman Gupta",
    phone: "9871122334",
    email: "aman.gupta2025@gmail.com",
    library_id: "lib-1",
    library_code: "LIB-DEL-01",
    library_name: "Apex Study & Reading Lounge",
    seat_number: "A-12",
    shift_name: "Morning (06:00 AM - 02:00 PM)",
    plan_name: "Monthly Full Day",
    fee_status: "PAID",
    admission_date: "2024-11-05",
    validity_end: "2025-04-05",
    status: "ACTIVE",
  },
  {
    id: "stu-2",
    name: "Priya Sneha Singh",
    phone: "9988776655",
    email: "priyasingh.upsc@gmail.com",
    library_id: "lib-1",
    library_code: "LIB-DEL-01",
    library_name: "Apex Study & Reading Lounge",
    seat_number: "B-05",
    shift_name: "Evening (02:00 PM - 10:00 PM)",
    plan_name: "Reserved Desk 3 Months",
    fee_status: "PAID",
    admission_date: "2024-12-10",
    validity_end: "2025-03-10",
    status: "ACTIVE",
  },
  {
    id: "stu-3",
    name: "Rohan Kapoor",
    phone: "9810987654",
    email: "rohan.kapoor99@gmail.com",
    library_id: "lib-1",
    library_code: "LIB-DEL-01",
    library_name: "Apex Study & Reading Lounge",
    seat_number: "C-01",
    shift_name: "Night (10:00 PM - 06:00 AM)",
    plan_name: "Night Owls Pass",
    fee_status: "OVERDUE",
    admission_date: "2024-10-01",
    validity_end: "2025-01-01",
    status: "INACTIVE",
    inactive_reason: "Plan expired, fee not renewed",
  },
  {
    id: "stu-3b",
    name: "Manish Tiwari",
    phone: "9811445566",
    email: "manish.tiwari@gmail.com",
    library_id: "lib-1",
    library_code: "LIB-DEL-01",
    library_name: "Apex Study & Reading Lounge",
    seat_number: "C-08",
    shift_name: "Evening (02:00 PM - 10:00 PM)",
    plan_name: "Monthly Full Day",
    fee_status: "PENDING",
    admission_date: "2024-11-20",
    validity_end: "2025-02-15",
    status: "SUSPENDED",
    inactive_reason: "Account suspended due to overdue fee",
  },
  {
    id: "stu-4",
    name: "Aditya Mishra",
    phone: "9711009988",
    email: "aditya.mishra.delhi@gmail.com",
    library_id: "lib-1",
    library_code: "LIB-DEL-01",
    library_name: "Apex Study & Reading Lounge",
    seat_number: "A-04",
    shift_name: "Morning (06:00 AM - 02:00 PM)",
    plan_name: "Monthly Full Day",
    fee_status: "PAID",
    admission_date: "2024-05-12",
    validity_end: "2024-09-12",
    status: "DELETED",
    deleted_at: "2024-09-15",
    delete_reason: "Cleared exam & relocated out of city",
  },

  // Central Library Hub (LIB-PAT-02)
  {
    id: "stu-5",
    name: "Alok Kumar Sinha",
    phone: "9431209876",
    email: "alok.sinha.patna@gmail.com",
    library_id: "lib-2",
    library_code: "LIB-PAT-02",
    library_name: "Central Library Hub",
    seat_number: "S-14",
    shift_name: "General Shift (08:00 AM - 08:00 PM)",
    plan_name: "BPSC Aspirant Special",
    fee_status: "PAID",
    admission_date: "2025-01-02",
    validity_end: "2025-07-02",
    status: "ACTIVE",
  },
  {
    id: "stu-6",
    name: "Komal Kumari",
    phone: "9570112244",
    email: "komal.patna2025@gmail.com",
    library_id: "lib-2",
    library_code: "LIB-PAT-02",
    library_name: "Central Library Hub",
    seat_number: "S-22",
    shift_name: "Morning Shift (07:00 AM - 01:00 PM)",
    plan_name: "Standard Monthly",
    fee_status: "PAID",
    admission_date: "2025-01-15",
    validity_end: "2025-02-15",
    status: "ACTIVE",
  },
  {
    id: "stu-7",
    name: "Saurabh Raj",
    phone: "9122334455",
    email: "saurabh.raj.bpsc@gmail.com",
    library_id: "lib-2",
    library_code: "LIB-PAT-02",
    library_name: "Central Library Hub",
    seat_number: "S-08",
    shift_name: "Evening Shift",
    plan_name: "Standard Monthly",
    fee_status: "PENDING",
    admission_date: "2024-11-20",
    validity_end: "2024-12-20",
    status: "INACTIVE",
    inactive_reason: "Temporarily left for native hometown",
  },
  {
    id: "stu-8",
    name: "Nidhi Pandey",
    phone: "9304556677",
    email: "nidhi.pandey.patna@gmail.com",
    library_id: "lib-2",
    library_code: "LIB-PAT-02",
    library_name: "Central Library Hub",
    seat_number: "S-30",
    shift_name: "Full Day Shift",
    plan_name: "Standard Monthly",
    fee_status: "PAID",
    admission_date: "2024-06-10",
    validity_end: "2024-08-10",
    status: "DELETED",
    deleted_at: "2024-08-12",
    delete_reason: "Admission cancelled on student request",
  },

  // Scholar's Den (LIB-JAI-03)
  {
    id: "stu-9",
    name: "Deepak Sharma",
    phone: "9828771122",
    email: "deepak.sharma.jaipur@gmail.com",
    library_id: "lib-3",
    library_code: "LIB-JAI-03",
    library_name: "Scholar's Den 24/7",
    seat_number: "D-18",
    shift_name: "24-Hours Dedicated",
    plan_name: "Premium Dedicated Desk",
    fee_status: "PAID",
    admission_date: "2024-10-15",
    validity_end: "2025-04-15",
    status: "ACTIVE",
  },
  {
    id: "stu-10",
    name: "Meenakshi Rathore",
    phone: "9414002233",
    email: "meenakshi.rathore@gmail.com",
    library_id: "lib-3",
    library_code: "LIB-JAI-03",
    library_name: "Scholar's Den 24/7",
    seat_number: "D-03",
    shift_name: "Morning (07:00 AM - 03:00 PM)",
    plan_name: "Quarterly Fixed",
    fee_status: "PAID",
    admission_date: "2025-01-05",
    validity_end: "2025-04-05",
    status: "ACTIVE",
  },
  {
    id: "stu-11",
    name: "Vikram Shekhawat",
    phone: "9829554433",
    email: "vikram.shekhawat.ras@gmail.com",
    library_id: "lib-3",
    library_code: "LIB-JAI-03",
    library_name: "Scholar's Den 24/7",
    seat_number: "D-45",
    shift_name: "Night Pass",
    plan_name: "Monthly",
    fee_status: "OVERDUE",
    admission_date: "2024-09-01",
    validity_end: "2024-11-01",
    status: "INACTIVE",
    inactive_reason: "Non-payment of membership dues",
  },
  {
    id: "stu-12",
    name: "Tanvi Shekhawat",
    phone: "9829117788",
    email: "tanvi.shekhawat98@gmail.com",
    library_id: "lib-3",
    library_code: "LIB-JAI-03",
    library_name: "Scholar's Den 24/7",
    seat_number: "D-11",
    shift_name: "Evening",
    plan_name: "Monthly",
    fee_status: "PAID",
    admission_date: "2024-04-01",
    validity_end: "2024-07-01",
    status: "DELETED",
    deleted_at: "2024-07-05",
    delete_reason: "Shifted to offline coaching hostel",
  },

  // Success Point (LIB-LKO-04)
  {
    id: "stu-13",
    name: "Harsh Vardhan Shukla",
    phone: "9451887766",
    email: "harsh.shukla.lko@gmail.com",
    library_id: "lib-4",
    library_code: "LIB-LKO-04",
    library_name: "Success Point Self Study",
    seat_number: "L-07",
    shift_name: "Full Day (08:00 AM - 08:00 PM)",
    plan_name: "Regular Study Plan",
    fee_status: "PAID",
    admission_date: "2025-01-10",
    validity_end: "2025-03-10",
    status: "ACTIVE",
  },
  {
    id: "stu-14",
    name: "Ananya Dixit",
    phone: "9415667788",
    email: "ananya.dixit.lko@gmail.com",
    library_id: "lib-4",
    library_code: "LIB-LKO-04",
    library_name: "Success Point Self Study",
    seat_number: "L-19",
    shift_name: "Morning (07:00 AM - 01:00 PM)",
    plan_name: "Regular Study Plan",
    fee_status: "PAID",
    admission_date: "2024-12-01",
    validity_end: "2025-02-01",
    status: "INACTIVE",
    inactive_reason: "Medical leave requested",
  },
  {
    id: "stu-15",
    name: "Mohd. Tariq",
    phone: "9839443322",
    email: "tariq.lucknow99@gmail.com",
    library_id: "lib-4",
    library_code: "LIB-LKO-04",
    library_name: "Success Point Self Study",
    seat_number: "L-24",
    shift_name: "Full Day",
    plan_name: "Regular Study Plan",
    fee_status: "PAID",
    admission_date: "2024-08-01",
    validity_end: "2024-10-01",
    status: "DELETED",
    deleted_at: "2024-10-03",
    delete_reason: "Completed UPSC interview preparation",
  },

  // Horizon Peaceful (LIB-MUM-05)
  {
    id: "stu-16",
    name: "Siddhesh Kadam",
    phone: "9820556677",
    email: "siddhesh.kadam.mumbai@gmail.com",
    library_id: "lib-5",
    library_code: "LIB-MUM-05",
    library_name: "Horizon Peaceful Library",
    seat_number: "M-02",
    shift_name: "CA Final Intensive Shift",
    plan_name: "CA Prep Monthly",
    fee_status: "OVERDUE",
    admission_date: "2024-10-01",
    validity_end: "2024-12-01",
    status: "INACTIVE",
    inactive_reason: "Library subscription currently suspended",
  },
  {
    id: "stu-17",
    name: "Roshni Patil",
    phone: "9819223344",
    email: "roshni.patil.vashi@gmail.com",
    library_id: "lib-5",
    library_code: "LIB-MUM-05",
    library_name: "Horizon Peaceful Library",
    seat_number: "M-14",
    shift_name: "Morning Shift",
    plan_name: "CA Prep Monthly",
    fee_status: "PAID",
    admission_date: "2024-07-01",
    validity_end: "2024-09-01",
    status: "DELETED",
    deleted_at: "2024-09-05",
    delete_reason: "Shifted to college library",
  },
];

const INITIAL_NOTIFICATIONS = [
  // 1. REGISTRATION REQUESTS (New Library applications)
  {
    id: "notif-reg-1",
    category: "REGISTRATION",
    title: "New Library Registration Application",
    sender_name: "Gyan Sarovar Self Study Library",
    owner_name: "Manoj Rathore",
    phone: "9823456780",
    email: "gyansarovar.indore@gmail.com",
    city: "Indore, Madhya Pradesh",
    requested_tier: "PRO_100",
    active_students_limit: 100,
    address: "Scheme 54, Near Vijay Nagar Square",
    description: "Applied for library onboarding on the platform. All documents and owner credentials submitted.",
    priority: "HIGH",
    status: "PENDING",
    created_at: "2026-09-26 14:30",
    is_read: false,
  },
  {
    id: "notif-reg-2",
    category: "REGISTRATION",
    title: "Branch Expansion Onboarding Request",
    sender_name: "Vidya Mandir Digital Reading Room",
    owner_name: "Sneha Mukherjee",
    phone: "9167890123",
    email: "vidyamandir.kol@gmail.com",
    city: "Kolkata, West Bengal",
    requested_tier: "ENTERPRISE",
    active_students_limit: 250,
    address: "Sector 1, Salt Lake City",
    description: "Opening 2nd branch in Kolkata. Requests fast onboarding with Enterprise unlimited seats plan.",
    priority: "MEDIUM",
    status: "PENDING",
    created_at: "2026-09-25 18:15",
    is_read: false,
  },

  // 2. SUPPORT REQUESTS
  {
    id: "notif-sup-1",
    category: "SUPPORT",
    title: "Help needed with Custom Shift Timing Setup",
    sender_name: "Apex Study & Reading Lounge",
    owner_name: "Rahul Sharma",
    library_code: "LIB-DEL-01",
    phone: "9876543210",
    email: "apex.delhi@gmail.com",
    city: "New Delhi",
    description: "We are introducing a 4-hour evening night-owl shift (10 PM to 02 AM). Need guidance on configuring student shift quotas.",
    priority: "MEDIUM",
    status: "OPEN",
    created_at: "2026-09-26 16:45",
    is_read: false,
  },
  {
    id: "notif-sup-2",
    category: "SUPPORT",
    title: "GST Tax Invoice & Annual Renewal Assistance",
    sender_name: "Scholar's Den 24/7",
    owner_name: "Pooja Choudhary",
    library_code: "LIB-JAI-03",
    phone: "9829012345",
    email: "scholarsden.jaipur@gmail.com",
    city: "Jaipur",
    description: "Our Enterprise subscription expired today. We need a formal GST tax invoice before processing payment via NEFT.",
    priority: "HIGH",
    status: "OPEN",
    created_at: "2026-09-26 11:20",
    is_read: false,
  },

  // 3. PROBLEMS / ISSUES REPORTED
  {
    id: "notif-prob-1",
    category: "PROBLEM",
    title: "Student Fee Receipt PDF Download Failure",
    sender_name: "Central Library Hub",
    owner_name: "Amit Kumar Verma",
    library_code: "LIB-PAT-02",
    phone: "9123456789",
    email: "centrallib.patna@gmail.com",
    city: "Patna",
    description: "Students report clicking 'Download Receipt' gives a blank page on mobile browser. Please inspect receipt generation script.",
    priority: "HIGH",
    status: "INVESTIGATING",
    created_at: "2026-09-26 13:10",
    is_read: false,
  },
  {
    id: "notif-prob-2",
    category: "PROBLEM",
    title: "WhatsApp SMS Gateway Delivery Delay",
    sender_name: "Success Point Self Study",
    owner_name: "Vikas Srivastava",
    library_code: "LIB-LKO-04",
    phone: "9450123987",
    email: "successpoint.lko@gmail.com",
    city: "Lucknow",
    description: "Payment confirmation messages for students are taking 15+ minutes to deliver on WhatsApp. Check webhook latency.",
    priority: "MEDIUM",
    status: "RESOLVED",
    created_at: "2026-09-25 20:00",
    is_read: true,
  },

  // 4. SYSTEM ALERTS
  {
    id: "notif-alt-1",
    category: "ALERT",
    title: "Subscription Expired: LIB-DEL-01 (Apex Study)",
    sender_name: "Automated Platform Monitor",
    library_code: "LIB-DEL-01",
    city: "New Delhi",
    description: "Subscription expired on 2026-09-20 (6 days overdue). Grace period active until month end.",
    priority: "HIGH",
    status: "ALERT",
    created_at: "2026-09-26 00:01",
    is_read: false,
  },
  {
    id: "notif-alt-2",
    category: "ALERT",
    title: "Quota Near Capacity: LIB-PAT-02 (Central Library)",
    sender_name: "Platform Quota Engine",
    library_code: "LIB-PAT-02",
    city: "Patna",
    description: "Central Library Hub has reached 90% of its active student quota allocation.",
    priority: "LOW",
    status: "ALERT",
    created_at: "2026-09-24 10:15",
    is_read: true,
  },
];

export const AdminDataProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.notifications || !Array.isArray(parsed.notifications)) {
          parsed.notifications = INITIAL_NOTIFICATIONS;
        }
        if (parsed.libraries && Array.isArray(parsed.libraries)) {
          parsed.libraries = parsed.libraries.map((lib, i) => {
            const initial = INITIAL_LIBRARIES.find((l) => l.id === lib.id) || INITIAL_LIBRARIES[i] || {};
            return {
              razorpay_sub_id: initial.razorpay_sub_id || `sub_Rzp${lib.id.replace(/\D/g, "")}84729`,
              razorpay_payment_id: initial.razorpay_payment_id || `pay_Op${lib.id.replace(/\D/g, "")}234710`,
              last_amount_paid: initial.last_amount_paid || (lib.subscription_tier === "STARTER" ? 499 : lib.subscription_tier === "ENTERPRISE" ? 29999 : 999),
              razorpay_status: initial.razorpay_status || "VERIFIED",
              auto_debit: initial.auto_debit !== undefined ? initial.auto_debit : true,
              ...lib,
            };
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
    return {
      libraries: INITIAL_LIBRARIES,
      fee_plans: INITIAL_FEE_PLANS,
      coupons: INITIAL_COUPONS,
      students: INITIAL_STUDENTS,
      notifications: INITIAL_NOTIFICATIONS,
    };
  });

  const [toastMsg, setToastMsg] = useState("");
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save admin state:", e);
    }
  }, [data]);

  // KPIs
  const stats = useMemo(() => {
    const totalLibs = data.libraries.length;
    const activeLibs = data.libraries.filter((l) => l.status === "ACTIVE").length;
    const totalStudents = data.students.length;
    const activeStudents = data.students.filter((s) => s.status === "ACTIVE").length;
    const suspendedStudents = data.students.filter((s) => s.status === "SUSPENDED").length;
    const inactiveStudents = data.students.filter((s) => s.status === "INACTIVE").length;
    const deletedStudents = data.students.filter((s) => s.status === "DELETED").length;
    const allStudents = data.students.filter((s) => s.status !== "DELETED").length;
    const totalSeats = data.libraries.reduce((acc, l) => acc + (Number(l.total_seats) || 0), 0);
    const activeCoupons = data.coupons.filter((c) => c.is_active).length;
    const notifs = data.notifications || [];
    const unreadNotifs = notifs.filter((n) => !n.is_read).length;
    const pendingRegistrations = notifs.filter((n) => n.category === "REGISTRATION" && n.status === "PENDING").length;
    const openSupportTickets = notifs.filter((n) => n.category === "SUPPORT" && n.status === "OPEN").length;
    const activeProblems = notifs.filter((n) => n.category === "PROBLEM" && (n.status === "OPEN" || n.status === "INVESTIGATING")).length;

    return {
      totalLibs,
      activeLibs,
      totalStudents,
      allStudents,
      activeStudents,
      suspendedStudents,
      inactiveStudents,
      deletedStudents,
      totalSeats,
      activeCoupons,
      unreadNotifs,
      pendingRegistrations,
      openSupportTickets,
      activeProblems,
    };
  }, [data]);

  // Library Matrix - Tracked by Active Students, not seats
  const libraryMatrix = useMemo(() => {
    return data.libraries.map((lib) => {
      const libStudents = data.students.filter((s) => s.library_id === lib.id);
      const activeCount = libStudents.filter((s) => s.status === "ACTIVE").length;
      const inactiveCount = libStudents.filter((s) => s.status === "INACTIVE").length;
      const deletedCount = libStudents.filter((s) => s.status === "DELETED").length;
      const quotaLimit = Number(lib.active_students_limit) || 100;
      const utilizationRate = Math.min(100, Math.round((activeCount / quotaLimit) * 100));

      return {
        ...lib,
        active_count: activeCount,
        inactive_count: inactiveCount,
        deleted_count: deletedCount,
        total_students: libStudents.length,
        occupancy_rate: utilizationRate,
        quota_utilization: utilizationRate,
      };
    });
  }, [data]);

  // Helper
  const calculateDaysLeft = (expiryDate) => {
    if (!expiryDate) return 0;
    const exp = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  };

  // Actions
  const resetDemoData = () => {
    if (window.confirm("Do you want to restore all admin demo data to default?")) {
      const reset = {
        libraries: INITIAL_LIBRARIES,
        fee_plans: INITIAL_FEE_PLANS,
        coupons: INITIAL_COUPONS,
        students: INITIAL_STUDENTS,
      };
      setData(reset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
      showToast("Admin data restored to default demo state!");
    }
  };

  const saveFeePlan = (updatedPlan) => {
    setData((prev) => ({
      ...prev,
      fee_plans: prev.fee_plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)),
    }));
    showToast("Fee Plan details updated successfully!");
  };

  const addFeePlan = (newPlan) => {
    setData((prev) => ({
      ...prev,
      fee_plans: [...prev.fee_plans, newPlan],
    }));
    showToast("New Fee Plan added successfully!");
  };

  const deleteFeePlan = (planId) => {
    if (data.fee_plans.length <= 1) {
      alert("At least one fee plan must be kept.");
      return;
    }
    setData((prev) => ({
      ...prev,
      fee_plans: prev.fee_plans.filter((p) => p.id !== planId),
    }));
    showToast("Fee Plan deleted.");
  };

  const saveLibraryProfile = (updatedLib) => {
    setData((prev) => ({
      ...prev,
      libraries: prev.libraries.map((l) => (l.id === updatedLib.id ? updatedLib : l)),
      students: prev.students.map((s) => {
        if (s.library_id === updatedLib.id) {
          return {
            ...s,
            library_code: updatedLib.code,
            library_name: updatedLib.name,
          };
        }
        return s;
      }),
    }));
    showToast(`Library ${updatedLib.code} profile updated successfully!`);
  };

  const saveLibraryQuota = (updatedLib) => {
    setData((prev) => ({
      ...prev,
      libraries: prev.libraries.map((l) =>
        l.id === updatedLib.id
          ? {
              ...l,
              total_seats: Number(updatedLib.total_seats),
              active_students_limit: Number(updatedLib.active_students_limit),
              status: updatedLib.status,
            }
          : l
      ),
    }));
    showToast("Library capacity & student quota updated!");
  };

  const toggleLibraryStatus = (libId) => {
    setData((prev) => ({
      ...prev,
      libraries: prev.libraries.map((l) => {
        if (l.id === libId) {
          const next = l.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          showToast(`Library ${l.code} is now ${next}`);
          return { ...l, status: next };
        }
        return l;
      }),
    }));
  };

  const renewLibrarySubscription = (libId, daysToAdd = 30) => {
    setData((prev) => ({
      ...prev,
      libraries: prev.libraries.map((l) => {
        if (l.id === libId) {
          const curr = new Date(l.subscription_expiry);
          curr.setDate(curr.getDate() + daysToAdd);
          const nextExp = curr.toISOString().split("T")[0];
          showToast(`Extended ${l.code} subscription by +${daysToAdd} Days!`);
          return { ...l, subscription_expiry: nextExp, subscription_status: "ACTIVE" };
        }
        return l;
      }),
    }));
  };

  const changeLibraryTier = (libId, nextTier) => {
    setData((prev) => ({
      ...prev,
      libraries: prev.libraries.map((l) => (l.id === libId ? { ...l, subscription_tier: nextTier } : l)),
    }));
    showToast(`Plan tier changed to ${nextTier}`);
  };

  const createCoupon = (newCoupon) => {
    setData((prev) => ({
      ...prev,
      coupons: [newCoupon, ...prev.coupons],
    }));
    showToast(`Coupon "${newCoupon.code}" created successfully!`);
  };

  const toggleCoupon = (couponId) => {
    setData((prev) => ({
      ...prev,
      coupons: prev.coupons.map((c) => (c.id === couponId ? { ...c, is_active: !c.is_active } : c)),
    }));
    showToast("Coupon status updated!");
  };

  const applyCouponToLibrary = (libId, planTier, couponId) => {
    const nextExp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setData((prev) => ({
      ...prev,
      libraries: prev.libraries.map((l) => {
        if (l.id === libId) {
          return {
            ...l,
            subscription_tier: planTier,
            subscription_status: "ACTIVE",
            subscription_expiry: nextExp,
          };
        }
        return l;
      }),
      coupons: prev.coupons.map((c) => (c.id === couponId ? { ...c, usage_count: c.usage_count + 1 } : c)),
    }));
    showToast("Subscription applied to Library with discount!");
  };

  // Notification Actions
  const markNotificationRead = (notifId) => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === notifId ? { ...n, is_read: true } : n
      ),
    }));
  };

  const markAllNotificationsRead = () => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, is_read: true })),
    }));
    showToast("All notifications marked as read!");
  };

  const approveRegistrationRequest = (notifId) => {
    const notif = (data.notifications || []).find((n) => n.id === notifId);
    if (!notif) return;

    const newCode = `LIB-${notif.city.substring(0, 3).toUpperCase()}-0${data.libraries.length + 1}`;
    const newLib = {
      id: `lib-${Date.now()}`,
      code: newCode,
      name: notif.sender_name,
      owner_name: notif.owner_name,
      phone: notif.phone,
      email: notif.email,
      city: notif.city,
      address: notif.address || notif.city,
      total_seats: notif.active_students_limit || 100,
      active_students_limit: notif.active_students_limit || 100,
      subscription_tier: notif.requested_tier || "PRO_100",
      subscription_cycle: "MONTHLY",
      subscription_start: new Date().toISOString().split("T")[0],
      subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "ACTIVE",
      created_at: new Date().toISOString().split("T")[0],
    };

    setData((prev) => ({
      ...prev,
      libraries: [newLib, ...prev.libraries],
      notifications: (prev.notifications || []).map((n) =>
        n.id === notifId
          ? {
              ...n,
              status: "APPROVED",
              is_read: true,
              approved_library_code: newCode,
            }
          : n
      ),
    }));
    showToast(`Library "${notif.sender_name}" approved & registered with code ${newCode}!`);
  };

  const rejectRegistrationRequest = (notifId, reason = "Documents verification incomplete") => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === notifId
          ? {
              ...n,
              status: "REJECTED",
              rejection_reason: reason,
              is_read: true,
            }
          : n
      ),
    }));
    showToast("Registration request rejected.");
  };

  const resolveNotification = (notifId, resolutionNote = "Issue resolved by Super Admin") => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === notifId
          ? {
              ...n,
              status: "RESOLVED",
              resolution_note: resolutionNote,
              is_read: true,
            }
          : n
      ),
    }));
    showToast("Ticket marked as RESOLVED!");
  };

  const deleteNotification = (notifId) => {
    setData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).filter((n) => n.id !== notifId),
    }));
    showToast("Notification removed.");
  };

  return (
    <AdminDataContext.Provider
      value={{
        data,
        stats,
        libraryMatrix,
        calculateDaysLeft,
        resetDemoData,
        saveFeePlan,
        addFeePlan,
        deleteFeePlan,
        saveLibraryProfile,
        saveLibraryQuota,
        toggleLibraryStatus,
        renewLibrarySubscription,
        changeLibraryTier,
        createCoupon,
        toggleCoupon,
        applyCouponToLibrary,
        markNotificationRead,
        markAllNotificationsRead,
        approveRegistrationRequest,
        rejectRegistrationRequest,
        resolveNotification,
        deleteNotification,
        showToast,
        toastMsg,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => useContext(AdminDataContext);
