import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PaymentStatus } from '../utils/types';

describe('StatusBadge', () => {
  it('deve renderizar o label do status', () => {
    const status: PaymentStatus = { label: 'Recebido', color: 'text-emerald-700', isLate: false };
    render(<StatusBadge status={status} />);
    expect(screen.getByText('Recebido')).toBeInTheDocument();
  });

  it('deve renderizar "Atrasado" corretamente', () => {
    const status: PaymentStatus = { label: 'Atrasado', color: 'text-red-700', isLate: true };
    render(<StatusBadge status={status} />);
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('deve renderizar "Pendente" corretamente', () => {
    const status: PaymentStatus = { label: 'Pendente', color: 'text-orange-600', isLate: false };
    render(<StatusBadge status={status} />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('deve aplicar classe de tamanho md quando especificado', () => {
    const status: PaymentStatus = { label: 'Teste', color: '', isLate: false };
    const { container } = render(<StatusBadge status={status} size="md" />);
    expect(container.firstChild).toHaveClass('px-2.5');
  });

  it('deve aplicar classe de tamanho sm por padrão', () => {
    const status: PaymentStatus = { label: 'Teste', color: '', isLate: false };
    const { container } = render(<StatusBadge status={status} />);
    expect(container.firstChild).toHaveClass('px-2');
  });
});
