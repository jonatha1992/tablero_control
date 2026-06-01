import { describe, it, expect } from 'vitest';
import { canMutateLocation } from '@/lib/permissions/location-access';
import type { UserBusiness } from '@/types/domain/user';

function m(
  partial: Pick<UserBusiness, 'businessId' | 'isActive'> & Partial<UserBusiness>,
): UserBusiness {
  const now = new Date();
  return {
    id: partial.id ?? `m-${Math.random().toString(36).slice(2)}`,
    userId: partial.userId ?? 'u-1',
    businessId: partial.businessId,
    role: partial.role ?? 'admin',
    locationId: partial.locationId,
    businessName: partial.businessName,
    isActive: partial.isActive,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

const admin = {
  id: 'adm-1',
  role: 'admin' as const,
  businessId: 'biz-1',
  memberships: [m({ businessId: 'biz-1', locationId: undefined, isActive: true, userId: 'adm-1', role: 'admin' })],
};

const superadminInTenant = {
  id: 'sa-1',
  role: 'superadmin' as const,
  businessId: 'biz-1',
  memberships: [],
};

const superadminGlobal = {
  id: 'sa-1',
  role: 'superadmin' as const,
  businessId: undefined,
  memberships: [],
};

const responsableOwn = {
  id: 'res-1',
  role: 'responsable' as const,
  businessId: 'biz-1',
  memberships: [m({ businessId: 'biz-1', locationId: 'loc-1', isActive: true, userId: 'res-1', role: 'responsable' })],
};

const responsableOther = {
  id: 'res-2',
  role: 'responsable' as const,
  businessId: 'biz-1',
  memberships: [m({ businessId: 'biz-1', locationId: 'loc-2', isActive: true, userId: 'res-2', role: 'responsable' })],
};

const miembro = {
  id: 'mem-1',
  role: 'miembro' as const,
  businessId: 'biz-1',
  memberships: [m({ businessId: 'biz-1', locationId: 'loc-1', isActive: true, userId: 'mem-1', role: 'miembro' })],
};

const location = { id: 'loc-1', businessId: 'biz-1', managerId: 'res-1' };

describe('canMutateLocation', () => {
  it('admin puede crear, editar y eliminar', () => {
    expect(canMutateLocation(admin, 'create')).toBe(true);
    expect(canMutateLocation(admin, 'update', location)).toBe(true);
    expect(canMutateLocation(admin, 'delete', location)).toBe(true);
  });

  it('superadmin con espacio activo puede mutar locations del tenant', () => {
    expect(canMutateLocation(superadminInTenant, 'create')).toBe(true);
    expect(canMutateLocation(superadminInTenant, 'update', location)).toBe(true);
  });

  it('superadmin sin businessId no puede mutar locations de clientes', () => {
    expect(canMutateLocation(superadminGlobal, 'update', location)).toBe(false);
  });

  it('responsable puede editar su sede asignada', () => {
    expect(canMutateLocation(responsableOwn, 'update', location)).toBe(true);
  });

  it('responsable no puede editar otra sede ni eliminar', () => {
    expect(canMutateLocation(responsableOther, 'update', location)).toBe(false);
    expect(canMutateLocation(responsableOwn, 'delete', location)).toBe(false);
    expect(canMutateLocation(responsableOwn, 'create')).toBe(false);
  });

  it('miembro no puede mutar locations', () => {
    expect(canMutateLocation(miembro, 'update', location)).toBe(false);
  });
});
