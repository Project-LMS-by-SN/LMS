const mongoose = require("mongoose");
const models = require("../models");
const { connectDB } = require("./db");

// Auto-connect Mongoose in background
connectDB().catch((err) => console.error("MongoDB init error:", err));

// Helper: Escape string for regex
const escapeRegExp = (string) => {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Relation metadata for relational where queries and includes
const RELATION_MAP = {
  Payment: {
    validity: { targetModel: "StudentValidity", foreignKey: "validityId", targetKey: "id" },
    paymentMode: { targetModel: "PaymentMode", foreignKey: "paymentModeId", targetKey: "id" },
  },
  StudentValidity: {
    student: { targetModel: "Student", foreignKey: "studentId", targetKey: "id" },
    feePlan: { targetModel: "FeePlan", foreignKey: "feePlanId", targetKey: "id" },
  },
  StudentShiftAssignment: {
    validity: { targetModel: "StudentValidity", foreignKey: "validityId", targetKey: "id" },
    shift: { targetModel: "Shift", foreignKey: "shiftId", targetKey: "id" },
    seat: { targetModel: "Seat", foreignKey: "seatId", targetKey: "id" },
  },
  Attendance: {
    shiftAssignment: { targetModel: "StudentShiftAssignment", foreignKey: "shiftAssignmentId", targetKey: "id" },
  },
  Student: {
    branch: { targetModel: "Branch", foreignKey: "branchId", targetKey: "id" },
  },
  Seat: {
    branch: { targetModel: "Branch", foreignKey: "branchId", targetKey: "id" },
  },
  Shift: {
    branch: { targetModel: "Branch", foreignKey: "branchId", targetKey: "id" },
  },
  User: {
    branch: { targetModel: "Branch", foreignKey: "branchId", targetKey: "id" },
  },
  UserSession: {
    user: { targetModel: "User", foreignKey: "userId", targetKey: "id" },
  },
};

// Numeric field names across all schemas that should be numbers in Mongo filters
const NUMERIC_FIELDS = new Set([
  "id",
  "branchId",
  "userId",
  "studentId",
  "feePlanId",
  "validityId",
  "paymentModeId",
  "shiftId",
  "seatId",
  "shiftAssignmentId",
  "createdBy",
  "amount",
  "amountReceived",
  "totalAmount",
  "registrationFee",
  "durationDays",
  "seq",
  "failedLoginAttempts",
  "pendingExpiryDays",
]);

const coerceValue = (key, val) => {
  if (val === null || val === undefined) return val;
  if (NUMERIC_FIELDS.has(key) && typeof val === "string" && !isNaN(Number(val)) && val.trim() !== "") {
    return Number(val);
  }
  return val;
};

// Helper: Merge existing and incoming conditions for the same field/foreignKey
const mergeCondition = (existing, incoming) => {
  if (existing === undefined) return incoming;
  if (incoming === undefined) return existing;

  const getScalar = (val) => {
    if (typeof val !== "object" || val === null) return val;
    if (val.$eq !== undefined) return val.$eq;
    return undefined;
  };

  const scalarA = getScalar(existing);
  const scalarB = getScalar(incoming);

  // Both are scalars (e.g. 16 and 16)
  if (scalarA !== undefined && scalarB !== undefined) {
    return scalarA === scalarB ? scalarA : { $in: [] };
  }

  // One is scalar, other is { $in: [...] }
  if (scalarA !== undefined && incoming && Array.isArray(incoming.$in)) {
    return incoming.$in.includes(scalarA) ? scalarA : { $in: [] };
  }
  if (scalarB !== undefined && existing && Array.isArray(existing.$in)) {
    return existing.$in.includes(scalarB) ? scalarB : { $in: [] };
  }

  // Both are { $in: [...] }
  if (existing && Array.isArray(existing.$in) && incoming && Array.isArray(incoming.$in)) {
    const setB = new Set(incoming.$in);
    return { $in: existing.$in.filter((x) => setB.has(x)) };
  }

  return { ...existing, ...incoming };
};

// Recursively convert where clause to Mongoose query
const resolveWhereFilters = async (modelName, where) => {
  if (!where || typeof where !== "object") return {};
  const cleaned = {};

  for (const [key, val] of Object.entries(where)) {
    if (val === undefined) continue;

    if (key === "OR" && Array.isArray(val)) {
      cleaned.$or = await Promise.all(val.map((item) => resolveWhereFilters(modelName, item)));
      continue;
    }
    if (key === "AND" && Array.isArray(val)) {
      cleaned.$and = await Promise.all(val.map((item) => resolveWhereFilters(modelName, item)));
      continue;
    }
    if (key === "NOT") {
      if (Array.isArray(val)) {
        cleaned.$nor = await Promise.all(val.map((item) => resolveWhereFilters(modelName, item)));
      } else {
        cleaned.$nor = [await resolveWhereFilters(modelName, val)];
      }
      continue;
    }

    // Check if this key is a direct relation
    const rel = RELATION_MAP[modelName]?.[key];
    if (rel && typeof val === "object" && !(val instanceof Date)) {
      const targetWhere = await resolveWhereFilters(rel.targetModel, val);
      const targetDocs = await models[rel.targetModel].find(targetWhere, { [rel.targetKey]: 1 }).lean().exec();
      const targetIds = targetDocs.map((d) => d[rel.targetKey]).filter((id) => id !== null && id !== undefined);
      cleaned[rel.foreignKey] = mergeCondition(cleaned[rel.foreignKey], { $in: targetIds });
      continue;
    }

    // Special case: Seat.assignments or Shift.assignments
    if ((modelName === "Seat" || modelName === "Shift") && key === "assignments") {
      const cond = val.some || val;
      const saWhere = await resolveWhereFilters("StudentShiftAssignment", cond);
      const targetField = modelName === "Seat" ? "seatId" : "shiftId";
      const saDocs = await models.StudentShiftAssignment.find(saWhere, { [targetField]: 1 }).lean().exec();
      const targetIds = saDocs.map((d) => d[targetField]).filter(Boolean);
      cleaned.id = mergeCondition(cleaned.id, { $in: targetIds });
      continue;
    }

    // Special case: Attendance.shiftAssignment.validity or similar deep relation
    if (modelName === "Attendance" && key === "shiftAssignment" && typeof val === "object") {
      const saWhere = await resolveWhereFilters("StudentShiftAssignment", val);
      const saDocs = await models.StudentShiftAssignment.find(saWhere, { id: 1 }).lean().exec();
      const targetIds = saDocs.map((d) => d.id).filter(Boolean);
      cleaned.shiftAssignmentId = mergeCondition(cleaned.shiftAssignmentId, { $in: targetIds });
      continue;
    }

    // Standard operators
    if (val !== null && typeof val === "object" && !(val instanceof Date)) {
      const ops = {};
      for (const [op, opVal] of Object.entries(val)) {
        if (opVal === undefined) continue;
        const coercedOpVal = coerceValue(key, opVal);

        switch (op) {
          case "equals":
            ops.$eq = coercedOpVal;
            break;
          case "not":
            ops.$ne = coercedOpVal;
            break;
          case "in":
            ops.$in = Array.isArray(opVal) ? opVal.map((v) => coerceValue(key, v)) : [coercedOpVal];
            break;
          case "notIn":
            ops.$nin = Array.isArray(opVal) ? opVal.map((v) => coerceValue(key, v)) : [coercedOpVal];
            break;
          case "lt":
            ops.$lt = coercedOpVal;
            break;
          case "lte":
            ops.$lte = coercedOpVal;
            break;
          case "gt":
            ops.$gt = coercedOpVal;
            break;
          case "gte":
            ops.$gte = coercedOpVal;
            break;
          case "contains":
            ops.$regex = escapeRegExp(opVal);
            if (val.mode !== "sensitive") ops.$options = "i";
            break;
          case "startsWith":
            ops.$regex = `^${escapeRegExp(opVal)}`;
            if (val.mode !== "sensitive") ops.$options = "i";
            break;
          case "endsWith":
            ops.$regex = `${escapeRegExp(opVal)}$`;
            if (val.mode !== "sensitive") ops.$options = "i";
            break;
          case "mode":
            break;
          default:
            ops[op] = coercedOpVal;
        }
      }
      const finalOp = Object.keys(ops).length > 0 ? ops : coerceValue(key, val);
      cleaned[key] = mergeCondition(cleaned[key], finalOp);
    } else {
      cleaned[key] = mergeCondition(cleaned[key], coerceValue(key, val));
    }
  }

  return cleaned;
};

// Helper: Convert 'orderBy' to Mongoose sort
const convertOrderBy = (orderBy) => {
  if (!orderBy) return {};
  const sort = {};
  if (Array.isArray(orderBy)) {
    for (const item of orderBy) {
      for (const [k, v] of Object.entries(item)) {
        sort[k] = v === "desc" || v === -1 ? -1 : 1;
      }
    }
  } else if (typeof orderBy === "object") {
    for (const [k, v] of Object.entries(orderBy)) {
      sort[k] = v === "desc" || v === -1 ? -1 : 1;
    }
  }
  return sort;
};

// Helper: Resolve includes on a single document
const resolveInclude = async (modelName, doc, include) => {
  if (!doc || !include || typeof include !== "object") return doc;
  const item = doc.toObject ? doc.toObject() : { ...doc };

  // 1. Student
  if (modelName === "Student") {
    if (include.branch && item.branchId) {
      item.branch = (await models.Branch.findOne({ id: item.branchId }).lean()) || null;
    }
    if (include.creator && item.createdBy) {
      item.creator = (await models.User.findOne({ id: item.createdBy }).lean()) || null;
    }
    if (include.validities) {
      let valWhere = { studentId: item.id };
      if (typeof include.validities === "object" && include.validities.where) {
        const subWhere = await resolveWhereFilters("StudentValidity", include.validities.where);
        valWhere = { ...valWhere, ...subWhere };
      }
      let valDocs = await models.StudentValidity.find(valWhere).lean().exec();
      if (typeof include.validities === "object" && include.validities.include) {
        item.validities = await Promise.all(
          valDocs.map((v) => resolveInclude("StudentValidity", v, include.validities.include))
        );
      } else {
        item.validities = valDocs;
      }
    }
  }

  // 2. StudentValidity
  if (modelName === "StudentValidity") {
    if (include.student && item.studentId) {
      const studentDoc = await models.Student.findOne({ id: item.studentId }).lean();
      if (studentDoc && typeof include.student === "object" && include.student.include) {
        item.student = await resolveInclude("Student", studentDoc, include.student.include);
      } else {
        item.student = studentDoc || null;
      }
    }
    if (include.feePlan && item.feePlanId) {
      item.feePlan = (await models.FeePlan.findOne({ id: item.feePlanId }).lean()) || null;
    }
    if (include.payments) {
      let payWhere = { validityId: item.id };
      if (typeof include.payments === "object" && include.payments.where) {
        const subWhere = await resolveWhereFilters("Payment", include.payments.where);
        payWhere = { ...payWhere, ...subWhere };
      }
      let payDocs = await models.Payment.find(payWhere).lean().exec();
      if (typeof include.payments === "object" && include.payments.include) {
        item.payments = await Promise.all(
          payDocs.map((p) => resolveInclude("Payment", p, include.payments.include))
        );
      } else {
        item.payments = payDocs;
      }
    }
    if (include.assignments) {
      let aWhere = { validityId: item.id };
      if (typeof include.assignments === "object" && include.assignments.where) {
        const subWhere = await resolveWhereFilters("StudentShiftAssignment", include.assignments.where);
        aWhere = { ...aWhere, ...subWhere };
      }
      let assignDocs = await models.StudentShiftAssignment.find(aWhere).lean().exec();
      if (typeof include.assignments === "object" && include.assignments.include) {
        item.assignments = await Promise.all(
          assignDocs.map((a) => resolveInclude("StudentShiftAssignment", a, include.assignments.include))
        );
      } else {
        item.assignments = assignDocs;
      }
    }
  }

  // 3. StudentShiftAssignment
  if (modelName === "StudentShiftAssignment") {
    if (include.validity && item.validityId) {
      const valDoc = await models.StudentValidity.findOne({ id: item.validityId }).lean();
      if (valDoc && typeof include.validity === "object" && include.validity.include) {
        item.validity = await resolveInclude("StudentValidity", valDoc, include.validity.include);
      } else {
        item.validity = valDoc || null;
      }
    }
    if (include.shift && item.shiftId) {
      item.shift = (await models.Shift.findOne({ id: item.shiftId }).lean()) || null;
    }
    if (include.seat && item.seatId) {
      item.seat = (await models.Seat.findOne({ id: item.seatId }).lean()) || null;
    }
    if (include.attendance) {
      const attDocs = await models.Attendance.find({ shiftAssignmentId: item.id }).lean().exec();
      item.attendance = attDocs;
    }
  }

  // 4. Payment
  if (modelName === "Payment") {
    if (include.validity && item.validityId) {
      const valDoc = await models.StudentValidity.findOne({ id: item.validityId }).lean();
      if (valDoc && typeof include.validity === "object" && include.validity.include) {
        item.validity = await resolveInclude("StudentValidity", valDoc, include.validity.include);
      } else {
        item.validity = valDoc || null;
      }
    }
    if (include.paymentMode && item.paymentModeId) {
      item.paymentMode = (await models.PaymentMode.findOne({ id: item.paymentModeId }).lean()) || null;
    }
  }

  // 5. User
  if (modelName === "User") {
    if (include.branch && item.branchId) {
      item.branch = (await models.Branch.findOne({ id: item.branchId }).lean()) || null;
    }
  }

  // 6. Branch
  if (modelName === "Branch") {
    if (include.shifts) {
      item.shifts = await models.Shift.find({ branchId: item.id }).lean().exec();
    }
    if (include.feePlans) {
      item.feePlans = await models.FeePlan.find({ branchId: item.id }).lean().exec();
    }
    if (include.seats) {
      item.seats = await models.Seat.find({ branchId: item.id }).lean().exec();
    }
    if (include.users) {
      item.users = await models.User.find({ branchId: item.id }).lean().exec();
    }
  }

  // 7. Seat
  if (modelName === "Seat") {
    if (include.branch && item.branchId) {
      item.branch = (await models.Branch.findOne({ id: item.branchId }).lean()) || null;
    }
    if (include.assignments) {
      let aWhere = { seatId: item.id };
      if (typeof include.assignments === "object" && include.assignments.where) {
        const subWhere = await resolveWhereFilters("StudentShiftAssignment", include.assignments.where);
        aWhere = { ...aWhere, ...subWhere };
      }
      const assignDocs = await models.StudentShiftAssignment.find(aWhere).lean().exec();
      if (typeof include.assignments === "object" && include.assignments.include) {
        item.assignments = await Promise.all(
          assignDocs.map((a) => resolveInclude("StudentShiftAssignment", a, include.assignments.include))
        );
      } else {
        item.assignments = assignDocs;
      }
    }
  }

  // 8. Shift
  if (modelName === "Shift") {
    if (include.branch && item.branchId) {
      item.branch = (await models.Branch.findOne({ id: item.branchId }).lean()) || null;
    }
    if (include.assignments) {
      let aWhere = { shiftId: item.id };
      if (typeof include.assignments === "object" && include.assignments.where) {
        const subWhere = await resolveWhereFilters("StudentShiftAssignment", include.assignments.where);
        aWhere = { ...aWhere, ...subWhere };
      }
      const assignDocs = await models.StudentShiftAssignment.find(aWhere).lean().exec();
      if (typeof include.assignments === "object" && include.assignments.include) {
        item.assignments = await Promise.all(
          assignDocs.map((a) => resolveInclude("StudentShiftAssignment", a, include.assignments.include))
        );
      } else {
        item.assignments = assignDocs;
      }
    }
  }

  // 9. Attendance
  if (modelName === "Attendance") {
    if (include.shiftAssignment && item.shiftAssignmentId) {
      const sa = await models.StudentShiftAssignment.findOne({ id: item.shiftAssignmentId }).lean();
      if (sa && typeof include.shiftAssignment === "object" && include.shiftAssignment.include) {
        item.shiftAssignment = await resolveInclude("StudentShiftAssignment", sa, include.shiftAssignment.include);
      } else {
        item.shiftAssignment = sa || null;
      }
    }
  }

  // 10. UserSession
  if (modelName === "UserSession") {
    if (include.user && item.userId) {
      const u = await models.User.findOne({ id: item.userId }).lean();
      if (u && typeof include.user === "object" && include.user.include) {
        item.user = await resolveInclude("User", u, include.user.include);
      } else {
        item.user = u || null;
      }
    }
  }

  return item;
};

// Helper: Handle select & include filtering
const applySelectAndInclude = async (modelName, doc, select, include) => {
  if (!doc) return null;

  // Build effective includes from both include and select
  const effectiveInclude = { ...(include || {}) };
  if (select && typeof select === "object") {
    for (const [key, val] of Object.entries(select)) {
      if (typeof val === "object" && val !== null) {
        effectiveInclude[key] = val;
      } else if (val === true && (RELATION_MAP[modelName]?.[key] || key === "assignments" || key === "branch" || key === "shifts")) {
        effectiveInclude[key] = true;
      }
    }
  }

  let item = await resolveInclude(modelName, doc, effectiveInclude);
  if (!item) return null;
  item = item.toObject ? item.toObject() : { ...item };

  // If select is provided, prune non-selected scalar fields
  if (select && typeof select === "object") {
    const projected = {};
    for (const [k, v] of Object.entries(select)) {
      if (v) {
        if (typeof v === "object" && v.select && item[k] && typeof item[k] === "object") {
          // Nested select on related doc
          if (Array.isArray(item[k])) {
            projected[k] = item[k].map((subDoc) => {
              const subProjected = {};
              for (const [sk, sv] of Object.entries(v.select)) {
                if (sv && subDoc[sk] !== undefined) subProjected[sk] = subDoc[sk];
              }
              return subProjected;
            });
          } else {
            const subProjected = {};
            for (const [sk, sv] of Object.entries(v.select)) {
              if (sv && item[k][sk] !== undefined) subProjected[sk] = item[k][sk];
            }
            projected[k] = subProjected;
          }
        } else {
          projected[k] = item[k] !== undefined ? item[k] : null;
        }
      }
    }
    return projected;
  }

  return item;
};

// Create a MongoDB model delegate for Mongoose
const createDelegate = (modelName, Model) => {
  return {
    model: Model,

    async findMany(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const sort = convertOrderBy(args.orderBy);
      let query = Model.find(filter);

      if (Object.keys(sort).length > 0) query = query.sort(sort);
      if (typeof args.skip === "number") query = query.skip(args.skip);
      if (typeof args.take === "number") query = query.limit(args.take);

      const docs = await query.exec();
      return Promise.all(docs.map((d) => applySelectAndInclude(modelName, d, args.select, args.include)));
    },

    async findFirst(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const sort = convertOrderBy(args.orderBy);
      let query = Model.findOne(filter);
      if (Object.keys(sort).length > 0) query = query.sort(sort);

      const doc = await query.exec();
      if (!doc) return null;
      return applySelectAndInclude(modelName, doc, args.select, args.include);
    },

    async findUnique(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const doc = await Model.findOne(filter).exec();
      if (!doc) return null;
      return applySelectAndInclude(modelName, doc, args.select, args.include);
    },

    async create(args = {}) {
      const data = { ...(args.data || {}) };
      if (data.id === undefined || data.id === null) {
        data.id = await models.getNextSequence(modelName);
      } else {
        await models.ensureCounterAtLeast(modelName, data.id);
      }
      const doc = new Model(data);
      await doc.save();
      return applySelectAndInclude(modelName, doc, args.select, args.include);
    },

    async createMany(args = {}) {
      const list = Array.isArray(args.data) ? [...args.data] : [];
      for (const item of list) {
        if (item.id === undefined || item.id === null) {
          item.id = await models.getNextSequence(modelName);
        } else {
          await models.ensureCounterAtLeast(modelName, item.id);
        }
      }
      const docs = await Model.insertMany(list);
      return { count: docs.length };
    },

    async update(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const doc = await Model.findOne(filter);
      if (!doc) {
        throw new Error(`Record to update not found in ${modelName}`);
      }
      if (args.data) {
        Object.assign(doc, args.data);
      }
      await doc.save();
      return applySelectAndInclude(modelName, doc, args.select, args.include);
    },

    async updateMany(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const res = await Model.updateMany(filter, { $set: args.data || {} });
      return { count: res.modifiedCount || 0 };
    },

    async delete(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const doc = await Model.findOneAndDelete(filter);
      return doc ? (doc.toObject ? doc.toObject() : doc) : null;
    },

    async deleteMany(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const res = await Model.deleteMany(filter);
      return { count: res.deletedCount || 0 };
    },

    async count(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      return Model.countDocuments(filter);
    },

    async upsert(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      let doc = await Model.findOne(filter);
      if (doc) {
        if (args.update) Object.assign(doc, args.update);
        await doc.save();
      } else {
        const data = { ...(args.create || {}) };
        if (data.id === undefined || data.id === null) {
          data.id = await models.getNextSequence(modelName);
        } else {
          await models.ensureCounterAtLeast(modelName, data.id);
        }
        doc = new Model(data);
        await doc.save();
      }
      return applySelectAndInclude(modelName, doc, args.select, args.include);
    },

    async aggregate(args = {}) {
      const filter = await resolveWhereFilters(modelName, args.where);
      const docs = await Model.find(filter).lean().exec();
      const result = { _sum: {}, _avg: {}, _count: docs.length, _min: {}, _max: {} };

      if (args._sum && typeof args._sum === "object") {
        for (const field of Object.keys(args._sum)) {
          const sum = docs.reduce((acc, doc) => acc + (Number(doc[field]) || 0), 0);
          result._sum[field] = docs.length > 0 ? sum : null;
        }
      }
      if (args._avg && typeof args._avg === "object") {
        for (const field of Object.keys(args._avg)) {
          const sum = docs.reduce((acc, doc) => acc + (Number(doc[field]) || 0), 0);
          result._avg[field] = docs.length > 0 ? sum / docs.length : null;
        }
      }
      if (args._min && typeof args._min === "object") {
        for (const field of Object.keys(args._min)) {
          const vals = docs.map((d) => d[field]).filter((v) => v !== null && v !== undefined);
          result._min[field] = vals.length > 0 ? Math.min(...vals) : null;
        }
      }
      if (args._max && typeof args._max === "object") {
        for (const field of Object.keys(args._max)) {
          const vals = docs.map((d) => d[field]).filter((v) => v !== null && v !== undefined);
          result._max[field] = vals.length > 0 ? Math.max(...vals) : null;
        }
      }
      return result;
    },
  };
};

// Main MongoDB database client interface
const mongoClient = {
  branch: createDelegate("Branch", models.Branch),
  user: createDelegate("User", models.User),
  userSession: createDelegate("UserSession", models.UserSession),
  student: createDelegate("Student", models.Student),
  feePlan: createDelegate("FeePlan", models.FeePlan),
  librarySetting: createDelegate("LibrarySetting", models.LibrarySetting),
  paymentMode: createDelegate("PaymentMode", models.PaymentMode),
  studentValidity: createDelegate("StudentValidity", models.StudentValidity),
  payment: createDelegate("Payment", models.Payment),
  seat: createDelegate("Seat", models.Seat),
  shift: createDelegate("Shift", models.Shift),
  studentShiftAssignment: createDelegate("StudentShiftAssignment", models.StudentShiftAssignment),
  attendance: createDelegate("Attendance", models.Attendance),
  auditLog: createDelegate("AuditLog", models.AuditLog),
  securityEvent: createDelegate("SecurityEvent", models.SecurityEvent),
  admissionRequest: createDelegate("AdmissionRequest", models.AdmissionRequest),
  expense: createDelegate("Expense", models.Expense),

  // Transaction support
  async $transaction(actions) {
    if (typeof actions === "function") {
      return actions(mongoClient);
    }
    if (Array.isArray(actions)) {
      return Promise.all(actions);
    }
    return actions;
  },

  async $disconnect() {
    await mongoose.disconnect();
  },

  models,
  mongoose,
};

module.exports = mongoClient;
