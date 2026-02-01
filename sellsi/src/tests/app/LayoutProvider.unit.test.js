import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock the exact provider module used by LayoutProvider
jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({ useAuth: jest.fn() }));
import { useAuth } from '../../infrastructure/providers/UnifiedAuthProvider';

import { LayoutProvider, useLayout } from '../../infrastructure/providers/LayoutProvider';
import { MemoryRouter } from 'react-router-dom';

const Control = () => {
  const {
    currentSideBarWidth,
    sideBarCollapsed,
    handleSideBarWidthChange,
  } = useLayout();

  // Render count helps detect unnecessary re-renders
  const renders = React.useRef(0);
  renders.current += 1;

  return (
    <div>
      <div data-testid="renders">{renders.current}</div>
      <div data-testid="width">{JSON.stringify(currentSideBarWidth)}</div>
      <div data-testid="collapsed">{String(sideBarCollapsed)}</div>
      <button
        data-testid="set-260"
        onClick={() => handleSideBarWidthChange('260px', false)}
      >
        set-260
      </button>
      <button
        data-testid="set-260-collapsed"
        onClick={() => handleSideBarWidthChange('260px', true)}
      >
        set-260-collapsed
      </button>
      <button
        data-testid="set-object-partial"
        onClick={() => handleSideBarWidthChange({ lg: '300px' }, false)}
      >
        set-object-partial
      </button>
      <button
        data-testid="set-invalid"
        onClick={() => handleSideBarWidthChange(null, false)}
      >
        set-invalid
      </button>
    </div>
  );
};

describe('LayoutProvider normalization & stability (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ session: null });
  });

  test('default width is normalized object and updates only on real changes', async () => {
    render(
      <MemoryRouter>
        <LayoutProvider>
          <Control />
        </LayoutProvider>
      </MemoryRouter>
    );

    const widthNode = await screen.findByTestId('width');
    const rendersNode = await screen.findByTestId('renders');

    const before = widthNode.textContent;
    expect(before).toMatch(/md/);
    expect(before).toMatch(/lg/);
    expect(before).toMatch(/xl/);

    // Set to a new value (string)
    act(() => fireEvent.click(screen.getByTestId('set-260')));

    const after = screen.getByTestId('width').textContent;
    expect(after).toContain('260px');

    // Click again with same canonical value -> should NOT increase renders
    const rendersNow = parseInt(screen.getByTestId('renders').textContent, 10);
    act(() => fireEvent.click(screen.getByTestId('set-260')));
    const rendersFinal = parseInt(screen.getByTestId('renders').textContent, 10);
    expect(rendersFinal).toBe(rendersNow);

    // Now send collapsed true with same width: width must remain equal but collapsed should change
    act(() => fireEvent.click(screen.getByTestId('set-260-collapsed')));
    expect(screen.getByTestId('width').textContent).toContain('260px');
    expect(screen.getByTestId('collapsed').textContent).toBe('true');

    // Partial object should normalize filling missing keys
    act(() => fireEvent.click(screen.getByTestId('set-object-partial')));
    expect(screen.getByTestId('width').textContent).toContain('300px');

    // Invalid input should fallback to defaults and not crash
    act(() => fireEvent.click(screen.getByTestId('set-invalid')));
    expect(screen.getByTestId('width').textContent).toMatch(/md/);
  });
});
