import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../components/ui/Toast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('deve começar sem toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('deve adicionar um toast de sucesso', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.showToast('Salvo!', 'success'); });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Salvo!');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('deve remover um toast pelo id', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.showToast('Erro', 'error'); });
    const id = result.current.toasts[0].id;
    act(() => { result.current.removeToast(id); });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('deve remover toast automaticamente após 5 segundos', () => {
    const { result } = renderHook(() => useToast());
    act(() => { result.current.showToast('Info', 'info'); });
    expect(result.current.toasts).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('deve suportar toast com ação', () => {
    const { result } = renderHook(() => useToast());
    const action = { label: 'Desfazer', onClick: vi.fn() };
    act(() => { result.current.showToast('Removido', 'success', action); });
    expect(result.current.toasts[0].action).toEqual(action);
  });
});
