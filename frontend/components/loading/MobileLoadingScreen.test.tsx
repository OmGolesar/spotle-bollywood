import { render, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileLoadingScreen } from './MobileLoadingScreen';

describe('MobileLoadingScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders a video element with the correct src and attributes', () => {
    render(<MobileLoadingScreen onComplete={() => {}} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    expect(video.tagName).toBe('VIDEO');
    expect(video.src).toContain('/loading/mobile-loading.mp4');
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
  });

  it('calls onComplete when the video ends', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    act(() => { video.dispatchEvent(new Event('ended')); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when the video errors', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    act(() => { video.dispatchEvent(new Event('error')); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete after 7s hard-cap even if nothing fires', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    act(() => { vi.advanceTimersByTime(7000); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when play() promise rejects (autoplay blocked)', async () => {
    HTMLMediaElement.prototype.play = vi.fn().mockRejectedValue(new Error('NotAllowedError'));
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('only calls onComplete once even if multiple events fire', () => {
    const onComplete = vi.fn();
    render(<MobileLoadingScreen onComplete={onComplete} />);
    const video = screen.getByLabelText('Loading') as HTMLVideoElement;
    act(() => { video.dispatchEvent(new Event('ended')); });
    act(() => { video.dispatchEvent(new Event('error')); });
    act(() => { vi.advanceTimersByTime(7000); });
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
