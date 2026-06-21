import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerToast, setToastCallback } from './toast';

describe('toast service', () => {
  beforeEach(() => {
    setToastCallback(null);
  });

  it('calls the registered callback', () => {
    const cb = vi.fn();
    setToastCallback(cb);
    triggerToast('hello', 'success', 2000);
    expect(cb).toHaveBeenCalledWith('hello', 'success', 2000);
  });

  it('does nothing when no callback registered', () => {
    expect(() => triggerToast('hello')).not.toThrow();
  });

  it('uses default duration of 4000', () => {
    const cb = vi.fn();
    setToastCallback(cb);
    triggerToast('test', 'info');
    expect(cb).toHaveBeenCalledWith('test', 'info', 4000);
  });

  it('uses default type of info', () => {
    const cb = vi.fn();
    setToastCallback(cb);
    triggerToast('test');
    expect(cb).toHaveBeenCalledWith('test', 'info', 4000);
  });

  it('overwrites previous callback', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    setToastCallback(cb1);
    setToastCallback(cb2);
    triggerToast('msg');
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
  });
});
