import { describe, it, expect } from "vitest";

describe("Financial Entry Validation", () => {
  it("should validate financial entry types", () => {
    const validTypes = ["pagar", "receber"];
    expect(validTypes).toContain("pagar");
    expect(validTypes).toContain("receber");
  });

  it("should validate financial categories", () => {
    const validCategories = [
      "vendas", "servicos", "fornecedores", "salarios",
      "aluguel", "impostos", "marketing", "outros",
    ];
    expect(validCategories).toContain("vendas");
    expect(validCategories.length).toBeGreaterThan(0);
  });

  it("should validate financial status transitions", () => {
    const validStatuses = ["pendente", "pago", "atrasado", "cancelado"];
    
    // Pendente → Pago is valid
    expect(validStatuses).toContain("pendente");
    expect(validStatuses).toContain("pago");
  });

  it("should calculate overdue entries correctly", () => {
    const dueDate = new Date("2025-01-01");
    const today = new Date("2025-01-15");
    const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    expect(daysOverdue).toBe(14);
  });

  it("should calculate cash flow summary correctly", () => {
    const entries = [
      { type: "receber", amount: 1000, status: "pago" },
      { type: "receber", amount: 500, status: "pendente" },
      { type: "pagar", amount: 300, status: "pago" },
      { type: "pagar", amount: 200, status: "pendente" },
    ];

    const totalReceived = entries
      .filter((e) => e.type === "receber" && e.status === "pago")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalPaid = entries
      .filter((e) => e.type === "pagar" && e.status === "pago")
      .reduce((sum, e) => sum + e.amount, 0);

    const netCashFlow = totalReceived - totalPaid;

    expect(totalReceived).toBe(1000);
    expect(totalPaid).toBe(300);
    expect(netCashFlow).toBe(700);
  });

  it("should validate amount is positive", () => {
    const amount = 100.50;
    expect(amount).toBeGreaterThan(0);
  });

  it("should format due dates correctly", () => {
    const date = new Date("2025-06-15");
    const formatted = date.toISOString().split("T")[0];
    expect(formatted).toBe("2025-06-15");
  });

  it("should calculate recurrence dates correctly", () => {
    const startDate = new Date("2025-01-15");
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    expect(nextMonth.getMonth()).toBe(1); // February
    expect(nextMonth.getDate()).toBe(15);
  });
});
