import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../src/App';

describe('App', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/members')) {
        return {
          ok: true,
          json: async () => [],
        };
      }

      if (url.includes('/api/availability')) {
        return {
          ok: true,
          json: async () => ({ month: 4, year: 2026, overrides: [] }),
        };
      }

      return {
        ok: true,
        json: async () => ({}),
      };
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('renders the month header and loads members', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /Escala de Louvor/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/members');
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/availability?month='));
    });
  });
});
