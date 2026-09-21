import { useEffect, useRef } from 'react';

import { programs, type OpenWindow } from './windows';

export function ProgramWindow({
  window,
  active,
  order,
  onActivate,
  onMinimize,
  onMaximize,
  onClose,
  guideClose,
  obscured,
}: {
  window: OpenWindow;
  active: boolean;
  order: number;
  onActivate: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  guideClose: boolean;
  obscured: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (
      active &&
      !obscured &&
      !document.activeElement?.closest('.method-picker')
    )
      ref.current?.focus();
  }, [active, obscured]);
  const program = programs[window.id];
  return (
    <section
      ref={ref}
      tabIndex={-1}
      hidden={window.minimized}
      inert={obscured}
      aria-label={`Janela ${program.name}`}
      className={`program-window ${window.maximized ? 'maximized' : ''}`}
      style={{ zIndex: order + 1, viewTransitionName: `program-${window.id}` }}
      onPointerDown={onActivate}
      onFocus={onActivate}
    >
      <header className="window-titlebar">
        <span className="program-icon" aria-hidden="true">
          {program.icon}
        </span>
        <span className="window-name">
          {program.name}
          <small>
            {active ? 'Janela ativa' : 'Em segundo plano'} ·{' '}
            {window.maximized ? 'Maximizada' : 'Restaurada'}
          </small>
        </span>
        <button aria-label={`Minimizar ${program.name}`} onClick={onMinimize}>
          —
        </button>
        <button
          aria-label={`${window.maximized ? 'Restaurar' : 'Maximizar'} ${program.name}`}
          onClick={onMaximize}
        >
          {window.maximized ? '❐' : '□'}
        </button>
        <button
          className={`window-close ${guideClose ? 'guided' : ''}`}
          aria-label={`Fechar ${program.name}`}
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <div className="window-content">{program.content}</div>
    </section>
  );
}
