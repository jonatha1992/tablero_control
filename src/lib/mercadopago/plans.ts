import type { PlanId } from '@/types/domain/subscription';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  currency: 'ARS';
  limits: {
    users: number;
    locations: number;
    projects: number;
    attachmentsPerMonth: number;
  };
  features: string[];
  highlight?: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'ARS',
    limits: { users: 3, locations: 1, projects: 2, attachmentsPerMonth: 10 },
    features: ['Kanban básico', 'Calendario', '1 local', 'Hasta 3 usuarios'],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 3999,
    priceYearly: 39990,
    currency: 'ARS',
    limits: { users: 10, locations: 3, projects: 10, attachmentsPerMonth: -1 },
    features: ['Todo en Free', '10 usuarios', '3 locales', 'Adjuntos ilimitados', 'Reportes básicos'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9999,
    priceYearly: 99990,
    currency: 'ARS',
    limits: { users: 50, locations: 10, projects: -1, attachmentsPerMonth: -1 },
    features: [
      'Todo en Basic',
      '50 usuarios',
      '10 locales',
      'Proyectos ilimitados',
      'Reportes avanzados + exportación',
      'Roles personalizados',
      'Soporte prioritario',
    ],
    highlight: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: -1,
    priceYearly: -1,
    currency: 'ARS',
    limits: { users: -1, locations: -1, projects: -1, attachmentsPerMonth: -1 },
    features: [
      'Todo en Pro',
      'Usuarios ilimitados',
      'Dominio personalizado',
      'SLA dedicado',
      'Integraciones custom',
    ],
  },
};

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}

export function planAllowsUnlimited(plan: PlanId, key: keyof PlanDefinition['limits']): boolean {
  return PLANS[plan].limits[key] === -1;
}

export function planLimit(plan: PlanId, key: keyof PlanDefinition['limits']): number {
  return PLANS[plan].limits[key];
}
