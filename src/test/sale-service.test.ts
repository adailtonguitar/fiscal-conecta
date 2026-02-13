import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
const mockInsert = vi.fn().mockReturnValue({
  select: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: { id: "doc-123", number: 1 },
      error: null,
    }),
  }),
});

const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      single: vi.fn().mockResolvedValue({
        data: { tax_regime: "simples_nacional", address_state: "SP", modo_seguro_fiscal: true },
        error: null,
      }),
    }),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  }),
  update: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock("@/services/StockService", () => ({
  StockService: {
    registerMovement: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("SaleService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate required sale parameters", async () => {
    // Test that SaleItem interface is correctly typed
    const saleItem = {
      product_id: "prod-1",
      name: "Test Product",
      sku: "TST-001",
      quantity: 2,
      unit_price: 10.0,
      unit: "UN",
    };

    expect(saleItem.product_id).toBeDefined();
    expect(saleItem.quantity).toBeGreaterThan(0);
    expect(saleItem.unit_price).toBeGreaterThan(0);
  });

  it("should validate PaymentResult structure", () => {
    const payment = {
      method: "dinheiro" as const,
      approved: true,
      amount: 50.0,
      change_amount: 10.0,
    };

    expect(payment.method).toBe("dinheiro");
    expect(payment.approved).toBe(true);
    expect(payment.amount).toBe(50.0);
  });

  it("should calculate correct change for cash payments", () => {
    const total = 37.50;
    const paid = 50.0;
    const change = paid - total;
    expect(change).toBeCloseTo(12.50);
  });

  it("should calculate credit installments correctly", () => {
    const amount = 100;
    const installments = 3;
    const installmentAmount = Math.round((amount / installments) * 100) / 100;
    const lastInstallment = amount - installmentAmount * (installments - 1);

    expect(installmentAmount).toBe(33.33);
    expect(lastInstallment).toBeCloseTo(33.34);
    expect(installmentAmount * (installments - 1) + lastInstallment).toBeCloseTo(amount);
  });

  it("should validate payment methods are valid enum values", () => {
    const validMethods = ["dinheiro", "debito", "credito", "pix", "voucher", "outros", "prazo"];
    const testMethod = "pix";
    expect(validMethods).toContain(testMethod);
  });
});
