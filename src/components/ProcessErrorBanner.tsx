import { useEffect, useRef } from 'react';

interface ProcessErrorBannerProps {
  message: string;
}

export function ProcessErrorBanner({ message }: ProcessErrorBannerProps) {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bannerRef.current?.focus();
  }, [message]);

  return (
    <div
      ref={bannerRef}
      id="process-error"
      className="status-panel status-panel--error"
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      {message}
    </div>
  );
}
