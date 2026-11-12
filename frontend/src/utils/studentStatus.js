export const DERIVED_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRING_SOON: "EXPIRING_SOON",
  EXPIRED_GRACE: "EXPIRED_GRACE",
  SUSPENDED: "SUSPENDED",
  INACTIVE: "INACTIVE",
  DISABLED: "DISABLED",
};

export const canManuallyActivateMember = (studentOrStatus) => {
  const raw = typeof studentOrStatus === "string" ? studentOrStatus : studentOrStatus?.account_status;
  return String(raw || "").trim().toUpperCase() === "DISABLED";
};

export const getMemberActionButtonMode = (studentOrStatus) =>
  canManuallyActivateMember(studentOrStatus) ? "activate" : "disable";

export const VALID_STATUS_FILTERS = ["all", "active", "expiring_soon", "expired", "suspended", "inactive", "disabled"];

export const getTodayYmdIST = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

export const addDaysToYmdIST = (ymd, days) => {
  const [y, m, d] = String(ymd).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + days));
  return dt.toISOString().slice(0, 10);
};

export const diffDaysYmd = (fromYmd, toYmd) => {
  const [fy, fm, fd] = String(fromYmd).split("-").map(Number);
  const [ty, tm, td] = String(toYmd).split("-").map(Number);
  const fromUtc = Date.UTC(fy, (fm || 1) - 1, fd || 1);
  const toUtc = Date.UTC(ty, (tm || 1) - 1, td || 1);
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
};

export const getExpirySubText = (dateStr, todayYmd = getTodayYmdIST()) => {
  if (!dateStr) return null;
  const endYmd = String(dateStr).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) return null;
  const diffDays = diffDaysYmd(todayYmd, endYmd);
  if (diffDays < 0) {
    const positiveDays = Math.abs(diffDays);
    return { text: `Expired ${positiveDays}d ago`, isExpired: true };
  }
  if (diffDays === 0) {
    return { text: "Expires today", isWarning: true };
  }
  return { text: `${diffDays}d left`, isExpired: false };
};

export const getGraceExpiredInfo = (studentObj, todayYmd = getTodayYmdIST()) => {
  if (!studentObj) return null;
  const acc = (studentObj.account_status || "").toUpperCase();
  if (acc !== "ACTIVE") return null;
  const rawEnd = studentObj.end_date || studentObj.validity?.end_date;
  if (!rawEnd) return null;
  const endYmd = String(rawEnd).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) return null;
  const tenDaysAgoYmd = addDaysToYmdIST(todayYmd, -10);
  if (endYmd < todayYmd && endYmd >= tenDaysAgoYmd) {
    return {
      endYmd,
      daysOverdue: diffDaysYmd(endYmd, todayYmd),
    };
  }
  return null;
};

export const getStudentStatus = (student, todayYmd = getTodayYmdIST()) => {
  const acc = (student.account_status || "").toUpperCase();
  if (acc === "DISABLED") {
    return "disabled";
  }
  if (acc === "INACTIVE") {
    return "inactive";
  }
  if (acc === "SUSPENDED") {
    return "suspended";
  }

  const tenDaysAgoYmd = addDaysToYmdIST(todayYmd, -10);
  const twentyDaysAgoYmd = addDaysToYmdIST(todayYmd, -20);
  const next7DaysYmd = addDaysToYmdIST(todayYmd, 7);

  if (!student.end_date) {
    if (!student.admission_date) return "inactive";
    const admissionYmd = String(student.admission_date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(admissionYmd)) return "inactive";
    if (admissionYmd < twentyDaysAgoYmd) return "inactive";
    if (admissionYmd < tenDaysAgoYmd) return "suspended";
    return "active";
  }

  const endYmd = String(student.end_date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) return "inactive";

  if (endYmd < twentyDaysAgoYmd) return "inactive";
  if (endYmd < tenDaysAgoYmd) return "suspended";
  if (endYmd < todayYmd) return "expired";
  if (endYmd <= next7DaysYmd) return "expiring_soon";
  return "active";
};

export const getDerivedStatus = (student, todayYmd = getTodayYmdIST()) => {
  const st = getStudentStatus(student, todayYmd);
  if (st === "disabled") return DERIVED_STATUS.DISABLED;
  if (st === "inactive") return DERIVED_STATUS.INACTIVE;
  if (st === "suspended") return DERIVED_STATUS.SUSPENDED;
  if (st === "expired") return DERIVED_STATUS.EXPIRED_GRACE;
  if (st === "expiring_soon") return DERIVED_STATUS.EXPIRING_SOON;
  return DERIVED_STATUS.ACTIVE;
};

export const getStatusCounts = (
  students = [],
  accessTypeFilter = "all",
  todayYmd = getTodayYmdIST()
) => {
  const base = students.filter((s) => {
    if (accessTypeFilter === "RESERVED") return s.access_type === "RESERVED";
    if (accessTypeFilter === "UNRESERVED") return s.access_type === "UNRESERVED";
    return true;
  });
  return {
    all: base.length,
    active: base.filter((s) => {
      const acc = (s.account_status || "").toUpperCase();
      if (acc === "SUSPENDED" || acc === "INACTIVE" || acc === "DISABLED") return false;
      const st = getStudentStatus(s, todayYmd);
      if (st === "suspended" || st === "inactive" || st === "disabled") return false;
      return st === "active" || st === "expiring_soon" || st === "expired";
    }).length,
    expiring_soon: base.filter((s) => getStudentStatus(s, todayYmd) === "expiring_soon").length,
    expired: base.filter((s) => getStudentStatus(s, todayYmd) === "expired").length,
    inactive: base.filter((s) => {
      const acc = (s.account_status || "").toUpperCase();
      if (acc === "DISABLED") return false;
      if (acc === "INACTIVE") return true;
      return getStudentStatus(s, todayYmd) === "inactive";
    }).length,
    suspended: base.filter((s) => {
      const acc = (s.account_status || "").toUpperCase();
      if (acc === "SUSPENDED") return true;
      return getStudentStatus(s, todayYmd) === "suspended";
    }).length,
    disabled: base.filter((s) => getStudentStatus(s, todayYmd) === "disabled").length,
  };
};

export const filterStudentsList = (
  students = [],
  { searchQuery = "", accessTypeFilter = "all", statusFilter = "all", todayYmd = getTodayYmdIST() } = {}
) => {
  const q = searchQuery.toLowerCase();
  return students.filter((student) => {
    const matchesSearch =
      student.full_name?.toLowerCase().includes(q) ||
      student.reg_no?.includes(searchQuery) ||
      student.mobile?.includes(searchQuery) ||
      student.student_code?.toLowerCase().includes(q) ||
      student.access_type?.toLowerCase().includes(q);

    if (accessTypeFilter === "RESERVED" && student.access_type !== "RESERVED") return false;
    if (accessTypeFilter === "UNRESERVED" && student.access_type !== "UNRESERVED") return false;
    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;

    if (statusFilter === "active") {
      const acc = (student.account_status || "").toUpperCase();
      if (acc === "SUSPENDED" || acc === "INACTIVE" || acc === "DISABLED") return false;
      const st = getStudentStatus(student, todayYmd);
      if (st === "suspended" || st === "inactive" || st === "disabled") return false;
      return st === "active" || st === "expiring_soon" || st === "expired";
    }

    if (statusFilter === "suspended") {
      const acc = (student.account_status || "").toUpperCase();
      if (acc === "SUSPENDED") return true;
      return getStudentStatus(student, todayYmd) === "suspended";
    }

    if (statusFilter === "inactive") {
      const acc = (student.account_status || "").toUpperCase();
      if (acc === "DISABLED") return false;
      if (acc === "INACTIVE") return true;
      return getStudentStatus(student, todayYmd) === "inactive";
    }

    if (statusFilter === "disabled") {
      return getStudentStatus(student, todayYmd) === "disabled";
    }

    return getStudentStatus(student, todayYmd) === statusFilter;
  });
};

