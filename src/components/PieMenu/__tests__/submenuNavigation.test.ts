import { describe, expect, it } from 'vitest';
import { canEnterSubmenu, getParentPopState } from '../submenuNavigation';

describe('submenu navigation', () => {
  it('does not pop to parent immediately after entering a submenu', () => {
    expect(getParentPopState(0, 20, 1, false)).toEqual({
      shouldPop: false,
      armed: false,
    });
  });

  it('arms parent pop after moving outside the submenu dead zone', () => {
    expect(getParentPopState(21, 20, 1, false)).toEqual({
      shouldPop: false,
      armed: true,
    });
  });

  it('pops only after returning to the center once armed', () => {
    expect(getParentPopState(10, 20, 1, true)).toEqual({
      shouldPop: true,
      armed: true,
    });
  });

  it('blocks duplicate submenu entry while a submenu load is pending', () => {
    expect(canEnterSubmenu(true, 0, 3)).toBe(false);
    expect(canEnterSubmenu(false, 3, 3)).toBe(false);
    expect(canEnterSubmenu(false, 2, 3)).toBe(true);
  });
});
