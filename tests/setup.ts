/**
 * Vitest Setup File
 * 
 * Настройка для:
 * - React Testing Library
 * - jest-dom matchers
 * - Next.js mocks
 */

import '@testing-library/jest-dom';

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: () => null,
    has: () => false,
    forEach: () => {},
  }),
}));

// Mock crypto API для Node.js
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
  } as Crypto;
}
