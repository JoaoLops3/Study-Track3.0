import { render, screen, act } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render success toast', () => {
    const onClose = jest.fn();
    render(<Toast message="Operação realizada com sucesso!" type="success" onClose={onClose} />);

    expect(screen.getByText('Operação realizada com sucesso!')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-green-500');
  });

  it('should render error toast', () => {
    const onClose = jest.fn();
    render(<Toast message="Ocorreu um erro!" type="error" onClose={onClose} />);

    expect(screen.getByText('Ocorreu um erro!')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-red-500');
  });

  it('should call onClose after duration', () => {
    const onClose = jest.fn();
    render(<Toast message="Test message" onClose={onClose} duration={1000} />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should not call onClose before duration', () => {
    const onClose = jest.fn();
    render(<Toast message="Test message" onClose={onClose} duration={1000} />);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
}); 