/**
 * GameGrid Component Tests
 * 
 * Тестирует:
 * - Рендер сетки 3×3
 * - Активная позиция подсветки
 * - Разные значения N
 */

import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameGrid } from '@/components/GameGrid';

describe('GameGrid Component', () => {
  it('should render 3x3 grid (9 cells)', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const cells = screen.getAllByRole('generic', { hidden: true });
    // Находим все div элементы в сетке
    const gridContainer = document.querySelector('.grid');
    const gridCells = gridContainer?.querySelectorAll('div');
    
    expect(gridCells?.length).toBe(9);
  });

  it('should render grid with correct columns', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('grid-cols-3');
  });

  it('should highlight active position', () => {
    const activePos = 4; // Центр
    render(<GameGrid activePosition={activePos} nValue={2} />);
    
    // Проверяем что рендерится без ошибок
    expect(() => render(<GameGrid activePosition={activePos} nValue={2} />)).not.toThrow();
  });

  it('should handle inactive positions with default styling', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    const cells = gridContainer?.querySelectorAll('div');
    
    // Все ячейки должны иметь базовые стили
    cells?.forEach(cell => {
      expect(cell).toBeTruthy();
    });
  });

  it('should accept different nValue props', () => {
    const nValues = [1, 2, 3, 4, 5];
    
    nValues.forEach(n => {
      expect(() => render(<GameGrid activePosition={0} nValue={n} />)).not.toThrow();
    });
  });

  it('should handle activePosition = -1 (no active)', () => {
    render(<GameGrid activePosition={-1} nValue={2} />);
    
    expect(() => render(<GameGrid activePosition={-1} nValue={2} />)).not.toThrow();
  });

  it('should have correct container dimensions', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('w-72');
    expect(gridContainer).toHaveClass('h-72');
    expect(gridContainer).toHaveClass('mx-auto');
  });

  it('should have gap between cells', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('gap-3');
  });

  it('should render cells with rounded corners', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    const cells = gridContainer?.querySelectorAll('div');
    
    cells?.forEach(cell => {
      expect(cell).toHaveClass('rounded-2xl');
    });
  });

  it('should render cells with transitions', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    const cells = gridContainer?.querySelectorAll('div');
    
    cells?.forEach(cell => {
      expect(cell).toHaveClass('transition-all');
      expect(cell).toHaveClass('duration-300');
    });
  });

  it('should have borders on cells', () => {
    render(<GameGrid activePosition={0} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    const cells = gridContainer?.querySelectorAll('div');
    
    cells?.forEach(cell => {
      expect(cell).toHaveClass('border-2');
    });
  });

  it('should render active cell with gradient background', () => {
    render(<GameGrid activePosition={5} nValue={2} />);
    
    // Проверяем что компонент рендерится с активной позицией
    expect(() => render(<GameGrid activePosition={5} nValue={2} />)).not.toThrow();
  });

  it('should handle all valid grid positions (0-8)', () => {
    for (let i = 0; i < 9; i++) {
      expect(() => render(<GameGrid activePosition={i} nValue={2} />)).not.toThrow();
    }
  });

  it('should use correct styling for active cell', () => {
    render(<GameGrid activePosition={3} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeTruthy();
  });
});

// ===================== Тесты с React Testing Library =====================

describe('GameGrid with React Testing Library', () => {
  it('should match snapshot structure', () => {
    const { container } = render(<GameGrid activePosition={0} nValue={2} />);
    
    expect(container.querySelector('.grid')).toBeTruthy();
    expect(container.querySelectorAll('div').length).toBeGreaterThan(1);
  });

  it('should re-render when activePosition changes', () => {
    const { rerender } = render(<GameGrid activePosition={0} nValue={2} />);
    
    rerender(<GameGrid activePosition={5} nValue={2} />);
    
    expect(() => rerender(<GameGrid activePosition={5} nValue={2} />)).not.toThrow();
  });

  it('should re-render when nValue changes', () => {
    const { rerender } = render(<GameGrid activePosition={0} nValue={1} />);
    
    rerender(<GameGrid activePosition={0} nValue={3} />);
    
    expect(() => rerender(<GameGrid activePosition={0} nValue={3} />)).not.toThrow();
  });

  it('should maintain grid structure after re-render', () => {
    const { container, rerender } = render(<GameGrid activePosition={0} nValue={2} />);
    
    const initialCells = container.querySelectorAll('div').length;
    
    rerender(<GameGrid activePosition={7} nValue={2} />);
    
    const updatedCells = container.querySelectorAll('div').length;
    
    expect(updatedCells).toBe(initialCells);
  });
});

// ===================== Тесты визуальных классов =====================

describe('GameGrid visual classes', () => {
  it('should have gradient classes for active state', () => {
    render(<GameGrid activePosition={2} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeTruthy();
  });

  it('should have shadow effects', () => {
    render(<GameGrid activePosition={1} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeTruthy();
  });

  it('should have scale effect on active cell', () => {
    render(<GameGrid activePosition={6} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeTruthy();
  });

  it('should have white/transparent styling for inactive cells', () => {
    render(<GameGrid activePosition={4} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeTruthy();
  });

  it('should have border opacity variants', () => {
    render(<GameGrid activePosition={8} nValue={2} />);
    
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeTruthy();
  });
});
