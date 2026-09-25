const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");
const authUtil = require("../src/utils/auth");

// Resolve the absolute path to dev.db (which is in backend/prisma/dev.db)
const dbPath = path.resolve(__dirname, "./dev.db");

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seeding...");

  // 1. Clean existing database
  await prisma.expense.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.studentShiftAssignment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentValidity.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.feePlan.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.paymentMode.deleteMany();
  await prisma.librarySetting.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Seed Default Branch
  const defaultBranch = await prisma.branch.create({
    data: {
      id: 1,
      code: "LB100001",
      name: "Main Branch",
      address: "123 Library Head Office, Sector 62, Noida, UP",
      phone: "+91 9876543210",
      isActive: true,
    },
  });

  // 3. Seed Library Settings
  await prisma.librarySetting.create({
    data: {
      id: 1,
      libraryName: "Knowledge Haven Library",
      address: "123 Learning Street, Sector 62, Noida, UP",
      phone: "+91 9876543210",
      email: "info@knowledgehaven.com",
    },
  });

  // 4. Seed Users
  // Ensure we have a default owner to start with. Let's hash the default password.
  const ownerEmail = "admin@admin.com";
  const defaultPassword = process.env.DEFAULT_OWNER_PASSWORD || "Password123!";
  const passwordHash = authUtil.hashPassword(defaultPassword);

  const userAdmin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: ownerEmail,
      passwordHash: passwordHash,
      role: "OWNER",
      isActive: true,
      mustChangePassword: true,
      branchId: defaultBranch.id,
    },
  });

  // 5. Seed Payment Modes
  const cashMode = await prisma.paymentMode.create({ data: { modeName: "Cash", isActive: true } });
  const upiMode = await prisma.paymentMode.create({ data: { modeName: "UPI", isActive: true } });
  const cardMode = await prisma.paymentMode.create({ data: { modeName: "Card", isActive: true } });

  // 6. Seed Fee Plans
  const planMonthly = await prisma.feePlan.create({
    data: { planName: "Monthly Plan (Reserved)", durationDays: 30, amount: 1000, isActive: true, branchId: defaultBranch.id, planType: "RESERVED" },
  });
  const planQuarterly = await prisma.feePlan.create({
    data: { planName: "Quarterly Plan (Reserved)", durationDays: 90, amount: 2700, isActive: true, branchId: defaultBranch.id, planType: "RESERVED" },
  });
  const planHalfYearly = await prisma.feePlan.create({
    data: { planName: "Half Yearly Plan (Reserved)", durationDays: 180, amount: 5000, isActive: true, branchId: defaultBranch.id, planType: "RESERVED" },
  });
  const planUnreservedMonthly = await prisma.feePlan.create({
    data: { planName: "Monthly Plan (Unreserved)", durationDays: 30, amount: 800, isActive: true, branchId: defaultBranch.id, planType: "UNRESERVED" },
  });

  // 7. Seed Shifts
  const shiftMorning = await prisma.shift.create({
    data: { shiftName: "Morning Shift", startTime: "08:00:00", endTime: "14:00:00", isActive: true, branchId: defaultBranch.id },
  });
  const shiftEvening = await prisma.shift.create({
    data: { shiftName: "Evening Shift", startTime: "14:00:00", endTime: "20:00:00", isActive: true, branchId: defaultBranch.id },
  });
  const shiftNight = await prisma.shift.create({
    data: { shiftName: "Night Shift", startTime: "20:00:00", endTime: "02:00:00", isActive: true, branchId: defaultBranch.id },
  });

  // 8. Seed Seats
  const seats = [];
  const seatPrefixes = ["A", "B", "C"];
  for (const prefix of seatPrefixes) {
    for (let i = 1; i <= 5; i++) {
      const seat = await prisma.seat.create({
        data: { seatNumber: `${prefix}${i}`, isActive: true, branchId: defaultBranch.id },
      });
      seats.push(seat);
    }
  }

  // Helper date generators relative to current time
  const getRelativeDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // 9. Seed Students & Their Relationships
  const studentsData = [
    {
      studentCode: "STU001",
      regNo: "REG2026001",
      fullName: "Aarav Sharma",
      mobile: "9876543210",
      gender: "MALE",
      dob: new Date("2001-04-12"),
      address: "Noida Sector 15, UP",
      admissionDate: getRelativeDate(-40),
      accountStatus: "ACTIVE",
    },
    {
      studentCode: "STU002",
      regNo: "REG2026002",
      fullName: "Ananya Iyer",
      mobile: "9988776655",
      gender: "FEMALE",
      dob: new Date("2002-08-22"),
      address: "Indirapuram, Ghaziabad",
      admissionDate: getRelativeDate(-35),
      accountStatus: "ACTIVE",
    },
    {
      studentCode: "STU003",
      regNo: "REG2026003",
      fullName: "Vihaan Verma",
      mobile: "9123456789",
      gender: "MALE",
      dob: new Date("2000-11-05"),
      address: "Mayur Vihar Phase 1, Delhi",
      admissionDate: getRelativeDate(-25),
      accountStatus: "ACTIVE",
    },
    {
      studentCode: "STU004",
      regNo: "REG2026004",
      fullName: "Diya Sen",
      mobile: "8877665544",
      gender: "FEMALE",
      dob: new Date("2003-01-18"),
      address: "Vasundhara, Ghaziabad",
      admissionDate: getRelativeDate(-20),
      accountStatus: "ACTIVE",
    },
    {
      studentCode: "STU005",
      regNo: "REG2026005",
      fullName: "Kabir Singh",
      mobile: "9560123456",
      gender: "MALE",
      dob: new Date("1999-07-30"),
      address: "Noida Sector 62, UP",
      admissionDate: getRelativeDate(-15),
      accountStatus: "DISABLED", // Suspended
    },
    {
      studentCode: "STU006",
      regNo: "REG2026006",
      fullName: "Riya Patel",
      mobile: "9818765432",
      gender: "FEMALE",
      dob: new Date("2002-05-14"),
      address: "Dwarka Sector 10, Delhi",
      admissionDate: getRelativeDate(-45),
      accountStatus: "ACTIVE", // Expired validity
    },
    {
      studentCode: "STU007",
      regNo: "REG2026007",
      fullName: "Aditya Rao",
      mobile: "9312345678",
      gender: "MALE",
      dob: new Date("2001-09-09"),
      address: "Noida Sector 22, UP",
      admissionDate: getRelativeDate(-3),
      accountStatus: "ACTIVE", // Expiring soon
    },
  ];

  const dbStudents = [];
  for (const sd of studentsData) {
    const student = await prisma.student.create({
      data: {
        ...sd,
        createdBy: userAdmin.id,
        branchId: defaultBranch.id,
      },
    });
    dbStudents.push(student);
  }

  // 10. Create Validities, Payments, and Shift Assignments
  
  // Student 1 (Aarav): Active RESERVED on Seat A1, Monthly Plan, Cash
  const validity1 = await prisma.studentValidity.create({
    data: {
      studentId: dbStudents[0].id,
      feePlanId: planMonthly.id,
      startDate: getRelativeDate(-10),
      endDate: getRelativeDate(20),
      totalAmount: 1000,
      accessType: "RESERVED",
    },
  });
  await prisma.payment.create({
    data: {
      validityId: validity1.id,
      paymentModeId: cashMode.id,
      invoiceNo: "INV-2026-001",
      amountReceived: 1000,
      paymentDate: getRelativeDate(-10),
      remarks: "Full Payment received",
    },
  });
  const assign1 = await prisma.studentShiftAssignment.create({
    data: {
      validityId: validity1.id,
      shiftId: shiftMorning.id,
      seatId: seats[0].id, // A1
      assignmentStatus: "ACTIVE",
    },
  });

  // Student 2 (Ananya): Active UNRESERVED (No seat assigned), Monthly Plan, UPI
  const validity2 = await prisma.studentValidity.create({
    data: {
      studentId: dbStudents[1].id,
      feePlanId: planMonthly.id,
      startDate: getRelativeDate(-15),
      endDate: getRelativeDate(15),
      totalAmount: 1000,
      accessType: "UNRESERVED",
    },
  });
  await prisma.payment.create({
    data: {
      validityId: validity2.id,
      paymentModeId: upiMode.id,
      invoiceNo: "INV-2026-002",
      amountReceived: 1000,
      paymentDate: getRelativeDate(-15),
      remarks: "Payment done online",
      utrNumber: "UTR98765432101",
    },
  });
  const assign2 = await prisma.studentShiftAssignment.create({
    data: {
      validityId: validity2.id,
      shiftId: shiftEvening.id,
      seatId: null,
      assignmentStatus: "ACTIVE",
    },
  });

  // Student 3 (Vihaan): Active RESERVED on Seat B2, Quarterly Plan, UPI
  const validity3 = await prisma.studentValidity.create({
    data: {
      studentId: dbStudents[2].id,
      feePlanId: planQuarterly.id,
      startDate: getRelativeDate(-25),
      endDate: getRelativeDate(65),
      totalAmount: 2700,
      accessType: "RESERVED",
    },
  });
  await prisma.payment.create({
    data: {
      validityId: validity3.id,
      paymentModeId: upiMode.id,
      invoiceNo: "INV-2026-003",
      amountReceived: 2700,
      paymentDate: getRelativeDate(-25),
      remarks: "Full Quarterly payment",
      utrNumber: "UTR98765432102",
    },
  });
  const assign3 = await prisma.studentShiftAssignment.create({
    data: {
      validityId: validity3.id,
      shiftId: shiftMorning.id,
      seatId: seats[6].id, // B2
      assignmentStatus: "ACTIVE",
    },
  });

  // Student 4 (Diya): Active RESERVED on Seat C3, Monthly Plan, UPI
  const validity4 = await prisma.studentValidity.create({
    data: {
      studentId: dbStudents[3].id,
      feePlanId: planMonthly.id,
      startDate: getRelativeDate(-5),
      endDate: getRelativeDate(25),
      totalAmount: 1000,
      accessType: "RESERVED",
    },
  });
  await prisma.payment.create({
    data: {
      validityId: validity4.id,
      paymentModeId: upiMode.id,
      invoiceNo: "INV-2026-004",
      amountReceived: 1000,
      paymentDate: getRelativeDate(-5),
      remarks: "UPI payment received",
      utrNumber: "UTR98765432103",
    },
  });
  const assign4 = await prisma.studentShiftAssignment.create({
    data: {
      validityId: validity4.id,
      shiftId: shiftEvening.id,
      seatId: seats[12].id, // C3
      assignmentStatus: "ACTIVE",
    },
  });

  // Student 5 (Kabir - Suspended): Active RESERVED on Seat A3 but status suspended
  const validity5 = await prisma.studentValidity.create({
    data: {
      studentId: dbStudents[4].id,
      feePlanId: planMonthly.id,
      startDate: getRelativeDate(-8),
      endDate: getRelativeDate(22),
      totalAmount: 1000,
      accessType: "RESERVED",
    },
  });
  await prisma.payment.create({
    data: {
      validityId: validity5.id,
      paymentModeId: cardMode.id,
      invoiceNo: "INV-2026-005",
      amountReceived: 1000,
      paymentDate: getRelativeDate(-8),
      remarks: "Card payment",
    },
  });
  const assign5 = await prisma.studentShiftAssignment.create({
    data: {
      validityId: validity5.id,
      shiftId: shiftNight.id,
      seatId: seats[2].id, // A3
      assignmentStatus: "ACTIVE",
    },
  });

  // Student 6 (Riya - Expired validity): Past validity from -45 days to -15 days
  const validity6 = await prisma.studentValidity.create({
    data: {
      studentId: dbStudents[5].id,
      feePlanId: planMonthly.id,
      startDate: getRelativeDate(-45),
      endDate: getRelativeDate(-15),
      totalAmount: 1000,
      accessType: "RESERVED",
    },
  });
  await prisma.payment.create({
    data: {
      validityId: validity6.id,
      paymentModeId: cashMode.id,
      invoiceNo: "INV-2026-006",
      amountReceived: 1000,
      paymentDate: getRelativeDate(-45),
      remarks: "Cash payment",
    },
  });
  const assign6 = await prisma.studentShiftAssignment.create({
    data: {
      validityId: validity6.id,
      shiftId: shiftMorning.id,
      seatId: seats[1].id, // A2 (ended)
      assignmentStatus: "ENDED",
    },
  });

  // Student 7 (Aditya - Expiring soon): Expiring in 3 days
  const validity7 = await prisma.studentValidity.create({
    data: {
      studentId: dbStudents[6].id,
      feePlanId: planMonthly.id,
      startDate: getRelativeDate(-27),
      endDate: getRelativeDate(3),
      totalAmount: 1000,
      accessType: "RESERVED",
    },
  });
  await prisma.payment.create({
    data: {
      validityId: validity7.id,
      paymentModeId: upiMode.id,
      invoiceNo: "INV-2026-007",
      amountReceived: 1000,
      paymentDate: getRelativeDate(-27),
      remarks: "Expiring validity student payment",
      utrNumber: "UTR98765432104",
    },
  });
  const assign7 = await prisma.studentShiftAssignment.create({
    data: {
      validityId: validity7.id,
      shiftId: shiftEvening.id,
      seatId: seats[1].id, // A2
      assignmentStatus: "ACTIVE",
    },
  });

  // 11. Seed Attendance
  // Seed past 7 days of attendance for active assignments
  const pastDays = [-6, -5, -4, -3, -2, -1, 0];
  const assignments = [assign1, assign2, assign3, assign4, assign7];
  
  for (const day of pastDays) {
    const attDate = getRelativeDate(day);
    for (const assign of assignments) {
      // Random present or absent (80% present, 20% absent)
      const isPresent = Math.random() > 0.2;
      await prisma.attendance.create({
        data: {
          shiftAssignmentId: assign.id,
          attendanceDate: attDate,
          status: isPresent ? "PRESENT" : "ABSENT",
          checkInTime: isPresent ? "08:15:00" : null,
          checkOutTime: isPresent ? "13:50:00" : null,
          remarks: isPresent ? "On time" : "Informed leave",
        },
      });
    }
  }

  // 12. Seed Mock Expenses
  const getCurrentMonthDate = (day) => {
    const d = new Date();
    d.setDate(day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const expensesData = [
    { category: "Maintenance", description: "Cleaning Supplies - Lizol floor cleaner and handwash refills", date: getCurrentMonthDate(11), amount: 450, branchId: defaultBranch.id },
    { category: "Other", description: "Drinking Water Jars - 30 water jars delivered from local distributor", date: getCurrentMonthDate(10), amount: 1200, branchId: defaultBranch.id },
    { category: "Electricity", description: "Electricity Bill - May - Paid online via UPPCL portal", date: getCurrentMonthDate(9), amount: 3200, branchId: defaultBranch.id },
    { category: "Rent", description: "Library Hall Rent - Paid to landlord for June 2026", date: getCurrentMonthDate(7), amount: 5000, branchId: defaultBranch.id },
    { category: "Other", description: "Newspapers & Magazines - Monthly subscription for Hindu, Dainik Bhaskar", date: getCurrentMonthDate(4), amount: 800, branchId: defaultBranch.id },
    { category: "Internet", description: "Airtel Fiber Wifi - Monthly recharge for 200 Mbps plan", date: getCurrentMonthDate(2), amount: 999, branchId: defaultBranch.id }
  ];

  for (const exp of expensesData) {
    await prisma.expense.create({
      data: exp
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
