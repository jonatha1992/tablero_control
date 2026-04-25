import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectorModal } from '@/components/sectores/sector-modal';
import type { Location } from '@/types/domain/location';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();

vi.mock('@/hooks/mutations/use-locations', () => ({
  useCreateLocation: vi.fn(() => ({
    mutate: mockCreateMutate,
    isPending: false,
  })),
  useUpdateLocation: vi.fn(() => ({
    mutate: mockUpdateMutate,
    isPending: false,
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Fixtures ───────────────────────────────────────────────────────────────

const existingLocation: Location = {
  id: 'loc-1',
  name: 'Depósito',
  description: 'Almacén principal',
  type: 'warehouse',
  businessId: 'biz-1',
  status: 'active',
  teamIds: [],
  taskIds: [],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Location;

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  businessId: 'biz-1',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SectorModal — modo creación', () => {
  it('muestra título "Nuevo Sector/Departamento"', () => {
    render(<SectorModal {...defaultProps} />);
    expect(screen.getByText(/Nuevo Sector\/Departamento/i)).toBeInTheDocument();
  });

  it('campos vacíos al abrir en modo creación', () => {
    render(<SectorModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText(/Ej: Departamento de IT/i);
    expect(nameInput).toHaveValue('');
  });

  it('tipo por defecto es "department"', () => {
    render(<SectorModal {...defaultProps} />);
    const typeInput = screen.getByPlaceholderText(/Ej: Oficina, Sector, Departamento/i);
    expect(typeInput).toHaveValue('department');
  });

  it('submit sin nombre: no llama a createMutation.mutate', async () => {
    render(<SectorModal {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: /Crear sector/i });
    fireEvent.click(submitBtn);
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('submit con nombre llama createMutation.mutate con datos correctos', async () => {
    render(<SectorModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText(/Ej: Departamento de IT/i);
    await userEvent.type(nameInput, 'Nuevo Sector');
    const submitBtn = screen.getByRole('button', { name: /Crear sector/i });
    fireEvent.click(submitBtn);
    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Nuevo Sector', businessId: 'biz-1', type: 'department' }),
      expect.any(Object)
    );
  });
});

describe('SectorModal — modo edición', () => {
  it('muestra título "Editar Sector/Departamento"', () => {
    render(<SectorModal {...defaultProps} location={existingLocation} />);
    expect(screen.getByText(/Editar Sector\/Departamento/i)).toBeInTheDocument();
  });

  it('pre-rellena el campo nombre con el valor existente', () => {
    render(<SectorModal {...defaultProps} location={existingLocation} />);
    const nameInput = screen.getByPlaceholderText(/Ej: Departamento de IT/i);
    expect(nameInput).toHaveValue('Depósito');
  });

  it('pre-rellena el campo tipo con el valor existente', () => {
    render(<SectorModal {...defaultProps} location={existingLocation} />);
    const typeInput = screen.getByPlaceholderText(/Ej: Oficina, Sector, Departamento/i);
    expect(typeInput).toHaveValue('warehouse');
  });

  it('pre-rellena descripción con el valor existente', () => {
    render(<SectorModal {...defaultProps} location={existingLocation} />);
    const descInput = screen.getByPlaceholderText(/Breve descripción/i);
    expect(descInput).toHaveValue('Almacén principal');
  });

  it('submit llama updateMutation.mutate (no createMutation.mutate)', async () => {
    render(<SectorModal {...defaultProps} location={existingLocation} />);
    const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(submitBtn);
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'loc-1' }),
      expect.any(Object)
    );
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });
});

describe('SectorModal — estado de carga', () => {
  it('inputs disabled mientras isPending=true', async () => {
    const { useCreateLocation } = vi.mocked(await import('@/hooks/mutations/use-locations'));
    vi.mocked(useCreateLocation).mockReturnValue({ mutate: mockCreateMutate, isPending: true } as never);

    render(<SectorModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText(/Ej: Departamento de IT/i);
    expect(nameInput).toBeDisabled();
  });
});
