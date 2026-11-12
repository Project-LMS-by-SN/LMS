const { formatDateStr, getISTTimeParts, addDaysToYmd } = require("./format");

const DERIVED_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRING_SOON: "EXPIRING_SOON",
  EXPIRED_GRACE: "EXPIRED_GRACE",
  SUSPENDED: "SUSPENDED",
  INACTIVE: "INACTIVE",
  DISABLED: "DISABLED",
  DELETED: "DELETED",
};

const diffDaysBetweenYmd = (fromYmd, toYmd) => {
  if (!fromYmd || !toYmd) return 0;
  const [fy, fm, fd] = String(fromYmd).split("-").map(Number);
  const [ty, tm, td] = String(toYmd).split("-").map(Number);
  const fromUtc = Date.UTC(fy, (fm || 1) - 1, fd || 1);
  const toUtc = Date.UTC(ty, (tm || 1) - 1, td || 1);
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
};

const getValidityEndInstantIST = (endDateOrYmd) => {
  if (!endDateOrYmd) return null;
  const endYmd =
    typeof endDateOrYmd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDateOrYmd)
      ? endDateOrYmd
      : formatDateStr(endDateOrYmd);
  if (!endYmd || !/^\d{4}-\d{2}-\d{2}$/.test(endYmd)) return null;
  return new Date(`${endYmd}T23:59:59.999+05:30`);
};

/**
 * Evaluates a student's DB targetAccountStatus AND UI derivedStatus in IST.
 *
 * Boundary Rules (IST - Asia/Kolkata):
 * - Day 0 (endDate == todayYmd): validity lasts until 23:59:59.999 IST -> EXPIRING_SOON (daysRemaining = 0)
 * - Next day 00:00:00 IST (endDate < todayYmd): Day 1 overdue begins
 * - 1..10 days overdue: DB stays ACTIVE, derivedStatus = EXPIRED_GRACE
 * - 11..20 days overdue/unpaid: DB becomes SUSPENDED, derivedStatus = SUSPENDED
 * - 21+ days overdue/unpaid: DB becomes INACTIVE, derivedStatus = INACTIVE (seat unassigned)
 * - Manual DISABLED / DELETED: preserved verbatim
 */
const evaluateStudentLifecycle = (student, now = new Date()) => {
  const currentAccountStatus = (student?.accountStatus || student?.account_status || "ACTIVE").toUpperCase();
  const todayYmd = getISTTimeParts(now).ymd;
  const tenDaysAgoYmd = addDaysToYmd(todayYmd, -10);
  const twentyDaysAgoYmd = addDaysToYmd(todayYmd, -20);

  const validities = Array.isArray(student?.validities) ? student.validities : [];
  const latestValidity = validities.length > 0 ? validities[validities.length - 1] : null;

  let totalPaid = 0;
  let totalAmount = 0;
  let dueAmount = 0;
  let endYmd = null;
  let effectiveStartYmd = null;

  if (latestValidity) {
    totalAmount = Number(latestValidity.totalAmount || 0);
    if (Array.isArray(latestValidity.payments)) {
      totalPaid = latestValidity.payments.reduce((sum, p) => sum + Number(p.amountReceived || 0), 0);
      dueAmount = Math.max(0, totalAmount - totalPaid);
    } else {
      // If payments relation was not loaded by caller, avoid treating totalPaid as 0 and falsely flagging dues
      totalPaid = totalAmount;
      dueAmount = 0;
    }
    endYmd = formatDateStr(latestValidity.endDate);
    effectiveStartYmd = formatDateStr(latestValidity.lastRenewedAt || latestValidity.startDate);
  } else if (student?.end_date || student?.endDate) {
    endYmd = formatDateStr(student.end_date || student.endDate);
    dueAmount = Math.max(0, Number(student.due_amount || 0));
    effectiveStartYmd = formatDateStr(student.admission_date || student.admissionDate);
  }

  const endInstant = endYmd ? getValidityEndInstantIST(endYmd) : null;
  const isExpired = Boolean(!endInstant || now.getTime() > endInstant.getTime());
  const daysRemaining = endYmd ? diffDaysBetweenYmd(todayYmd, endYmd) : null;
  const daysOverdue = isExpired && endYmd ? Math.max(1, diffDaysBetweenYmd(endYmd, todayYmd)) : 0;

  if (currentAccountStatus === "DELETED" || student?.deletedAt) {
    return {
      targetAccountStatus: "DELETED",
      derivedStatus: DERIVED_STATUS.DELETED,
      dueAmount,
      endYmd,
      daysRemaining,
      daysOverdue,
      isExpired,
      isGraceExpired: false,
      todayYmd,
    };
  }

  if (currentAccountStatus === "DISABLED") {
    return {
      targetAccountStatus: "DISABLED",
      derivedStatus: DERIVED_STATUS.DISABLED,
      dueAmount,
      endYmd,
      daysRemaining,
      daysOverdue,
      isExpired,
      isGraceExpired: false,
      todayYmd,
    };
  }

  let targetAccountStatus = "ACTIVE";

  if (!latestValidity && !endYmd) {
    const admissionYmd = formatDateStr(student?.admissionDate || student?.admission_date);
    if (admissionYmd && admissionYmd < twentyDaysAgoYmd) {
      targetAccountStatus = "INACTIVE";
    } else if (admissionYmd && admissionYmd < tenDaysAgoYmd) {
      targetAccountStatus = "SUSPENDED";
    }
  } else {
    const hasDue = dueAmount > 0;
    if (hasDue || isExpired) {
      let refYmd = isExpired ? endYmd : effectiveStartYmd;
      if (isExpired && hasDue && endYmd && effectiveStartYmd) {
        refYmd = endYmd < effectiveStartYmd ? endYmd : effectiveStartYmd;
      }
      if (!refYmd || refYmd < twentyDaysAgoYmd) {
        targetAccountStatus = "INACTIVE";
      } else if (refYmd < tenDaysAgoYmd) {
        targetAccountStatus = "SUSPENDED";
      }
    }
  }

  let derivedStatus = DERIVED_STATUS.ACTIVE;
  if (targetAccountStatus === "INACTIVE") {
    derivedStatus = DERIVED_STATUS.INACTIVE;
  } else if (targetAccountStatus === "SUSPENDED") {
    derivedStatus = DERIVED_STATUS.SUSPENDED;
  } else if (isExpired && daysOverdue >= 1 && daysOverdue <= 10) {
    derivedStatus = DERIVED_STATUS.EXPIRED_GRACE;
  } else if (daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7) {
    derivedStatus = DERIVED_STATUS.EXPIRING_SOON;
  }

  return {
    targetAccountStatus,
    derivedStatus,
    dueAmount,
    endYmd,
    daysRemaining,
    daysOverdue,
    isExpired,
    isGraceExpired: derivedStatus === DERIVED_STATUS.EXPIRED_GRACE,
    todayYmd,
  };
};

module.exports = {
  DERIVED_STATUS,
  diffDaysBetweenYmd,
  getValidityEndInstantIST,
  evaluateStudentLifecycle,
};

