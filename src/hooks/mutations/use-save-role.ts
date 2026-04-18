'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, doc, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/auth-context';
import { useBusinessQuery } from '@/hooks/queries/use-business-query';
import type { CustomRole } from '@/types/domain/custom-role';
import { validateCustomRole } from '@/lib/permissions/validate-role';

type SaveRoleArgs = Omit<CustomRole, 'id' | 'createdAt' | 'updatedAt' | 'userCount' | 'businessId' | 'createdBy'> & { id?: string };

export function useSaveRole() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: business } = useBusinessQuery(user?.businessId);

  return useMutation({
    mutationFn: async (role: SaveRoleArgs) => {
      if (!user?.businessId) throw new Error('Sin business');
      const plan = business?.plan ?? 'free';
      const errors = validateCustomRole(role, plan);
      if (errors.length > 0) throw new Error(errors.map((e) => e.message).join(', '));

      const colRef = collection(db, 'businesses', user.businessId, 'roles');
      const ref = role.id ? doc(colRef, role.id) : doc(colRef);

      const data = {
        ...role,
        businessId: user.businessId,
        updatedAt: serverTimestamp(),
        ...(role.id ? {} : { createdBy: user.id, createdAt: serverTimestamp(), userCount: 0 }),
      };
      delete (data as Partial<SaveRoleArgs>).id;

      if (role.id) {
        await updateDoc(ref, data);
      } else {
        await setDoc(ref, data);
      }
      return ref.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles', user?.businessId] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (roleId: string) => {
      if (!user?.businessId) throw new Error('Sin business');
      await deleteDoc(doc(db, 'businesses', user.businessId, 'roles', roleId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles', user?.businessId] }),
  });
}

export function useToggleRole() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roleId, isActive }: { roleId: string; isActive: boolean }) => {
      if (!user?.businessId) throw new Error('Sin business');
      await updateDoc(doc(db, 'businesses', user.businessId, 'roles', roleId), {
        isActive, updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles', user?.businessId] }),
  });
}
