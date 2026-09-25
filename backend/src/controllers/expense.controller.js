const prisma = require("../config/prisma");

const formatExpense = (exp) => ({
  id: exp.id,
  category: exp.category,
  description: exp.description,
  date: exp.date,
  amount: exp.amount ? Number(exp.amount) : 0,
  branch_id: exp.branchId,
  created_at: exp.createdAt,
});

const getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { branchId: req.user.branchId },
      orderBy: { date: "desc" },
    });

    // Calculate total expenses for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthExpenses = expenses
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate category breakdown
    const categoryTotals = expenses.reduce((acc, e) => {
      const cat = e.category;
      acc[cat] = (acc[cat] || 0) + Number(e.amount);
      return acc;
    }, {});

    const totalAllTime = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    const breakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAllTime > 0 ? Math.round((amount / totalAllTime) * 100) : 0,
    }));

    res.json({
      success: true,
      data: {
        list: expenses.map(formatExpense),
        totalThisMonth: thisMonthExpenses,
        breakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

const createExpense = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage expenses" });
    }

    const { category, description, date, amount } = req.body;

    if (!category || !description || !date || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "category, description, date, and amount are required",
      });
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat < 0) {
      return res.status(400).json({
        success: false,
        message: "amount must be a non-negative number",
      });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        description,
        date: new Date(date),
        amount: amountFloat,
        branchId: req.user.branchId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: formatExpense(expense),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message,
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Only owners can manage expenses" });
    }

    const { id } = req.params;
    const expenseId = parseInt(id);

    const existing = await prisma.expense.findFirst({
      where: { id: expenseId, branchId: req.user.branchId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
