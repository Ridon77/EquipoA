import { useEffect, useId, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrBackIcon } from './QrIcons';

export interface FormQrOverlayProps {
  isOpen: boolean;
  formUrl: string;
  onClose: () => void;
}

export function FormQrOverlay({ isOpen, formUrl, onClose }: FormQrOverlayProps) {
  const titleId = useId();
  const descriptionId = useId();
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    backButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !overlayRef.current) {
        return;
      }

      const focusableElements = overlayRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href]',
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className="qr-overlay qr-overlay--open"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="qr-overlay__content">
        <p className="qr-overlay__brand">Equipo A</p>
        <h2 id={titleId} className="qr-overlay__title">
          Abrir el formulario
        </h2>
        <p id={descriptionId} className="qr-overlay__description">
          Escanee este código QR para acceder al formulario desde otro
          dispositivo.
        </p>

        <div className="qr-overlay__code" aria-hidden="false">
          <QRCodeSVG
            value={formUrl}
            bgColor="#FFFFFF"
            fgColor="#0b1f3a"
            level="M"
            marginSize={2}
            className="qr-overlay__svg"
          />
        </div>

        <a className="qr-overlay__link" href={formUrl}>
          Abrir formulario
        </a>

        <button
          ref={backButtonRef}
          type="button"
          className="qr-overlay__back-button button button--secondary"
          onClick={onClose}
        >
          <QrBackIcon />
          <span>Volver al formulario</span>
        </button>
      </div>
    </div>
  );
}
