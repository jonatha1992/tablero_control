import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPreapproval } from '@/lib/mercadopago/preapproval';
import { mpFetch } from '@/lib/mercadopago/client';
import { getEffectivePlanConfig } from '@/lib/mercadopago/plan-config';

vi.mock('@/lib/mercadopago/client', () => ({
  mpFetch: vi.fn(),
}));

vi.mock('@/lib/mercadopago/plan-config', () => ({
  getEffectivePlanConfig: vi.fn(),
}));

const mockMpFetch = vi.mocked(mpFetch);
const mockGetEffectivePlanConfig = vi.mocked(getEffectivePlanConfig);

describe('createPreapproval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEffectivePlanConfig.mockResolvedValue({
      id: 'pro',
      name: 'Pro',
      priceMonthly: 30000,
      priceYearly: 300000,
      currency: 'ARS',
      limits: {
        users: 50,
        locations: 10,
        projects: -1,
        attachmentsPerMonth: -1,
      },
      features: [],
      highlight: true,
    });
    mockMpFetch.mockResolvedValue({
      id: 'preapproval-1',
      status: 'pending',
      init_point: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=preapproval-1',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 30000,
        currency_id: 'ARS',
      },
    });
  });

  it('envia payer_email porque MP lo requiere para identificar al pagador', async () => {
    await createPreapproval({
      plan: 'pro',
      frequency: 'monthly',
      businessId: 'biz-1',
      backUrl: 'https://app.test/dashboard/billing?status=pending',
      payerEmail: 'admin@test.com',
    });

    expect(mockMpFetch).toHaveBeenCalledWith('/preapproval', expect.objectContaining({
      method: 'POST',
    }));
    const [, init] = mockMpFetch.mock.calls[0];
    if (!init) throw new Error('mpFetch init no fue informado');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      external_reference: 'biz:biz-1:pro:monthly',
      back_url: 'https://app.test/dashboard/billing?status=pending',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 30000,
        currency_id: 'ARS',
      },
      status: 'pending',
    });
    expect(body).toHaveProperty('payer_email', 'admin@test.com');
  });
});
