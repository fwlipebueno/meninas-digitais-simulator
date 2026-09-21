import { useEffect, useRef, useState } from 'react';
import { programs, type OpenWindow, type ProgramId } from './windows';

export function SwitchPrograms({
  mode,
  windows,
  active,
  onActivate,
  onDismiss,
}: {
  mode: 'alt-tab' | 'task-view';
  windows: OpenWindow[];
  active: ProgramId | undefined;
  onActivate: (id: ProgramId) => void;
  onDismiss: () => void;
}) {
  const [selection, setSelection] = useState(active);
  const selected =
    windows.find((window) => window.id === selection) ?? windows[0];
  const panel = useRef<HTMLElement>(null);
  const selectedButton = useRef<HTMLButtonElement>(null);
  const taskView = mode === 'task-view';
  useEffect(() => {
    panel.current?.focus();
  }, []);
  useEffect(() => {
    if (taskView) selectedButton.current?.focus();
  }, [selection, taskView]);

  function cycle(direction: number) {
    const index = windows.findIndex((window) => window.id === selected?.id);
    setSelection(
      windows[(index + direction + windows.length) % windows.length]?.id,
    );
  }

  return (
    <div
      className="switch-overlay"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onDismiss();
        }
      }}
    >
      <button
        className="overlay-dismiss"
        aria-label={
          taskView
            ? 'Sair da Visão de Tarefas sem alternar'
            : 'Cancelar alternância'
        }
        onClick={onDismiss}
      />
      <section
        ref={panel}
        tabIndex={-1}
        className="switch-panel"
        aria-label={taskView ? 'Visão de Tarefas' : 'Seletor Alt + Tab'}
        onKeyDown={(event) => {
          if (
            taskView &&
            ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(
              event.key,
            )
          ) {
            event.preventDefault();
            cycle(
              event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1,
            );
          }
        }}
      >
        <div className="panel-heading">
          <h2>
            {taskView ? 'Visão de Tarefas' : 'Alt pressionado na simulação'}
          </h2>
          <button onClick={onDismiss}>Esc</button>
        </div>
        {taskView ? (
          <>
            <h3>Áreas de trabalho</h3>
            <p className="virtual-desktop">✓ Área de trabalho 1 · Atual</p>
            <p>
              Escolha uma miniatura ou use as setas e Enter. Esc ou a área vazia
              cancela.
            </p>
          </>
        ) : (
          <p>
            Use o botão Tab para percorrer as janelas. Soltar Alt ativa a
            selecionada.
          </p>
        )}
        {windows.length === 0 && <p>Nenhum programa aberto.</p>}
        <ul className="window-previews" aria-label="Janelas abertas">
          {windows.map((window) => {
            const chosen = window.id === selected?.id;
            const content = (
              <>
                <span className="window-preview" aria-hidden="true">
                  <span className="program-icon">
                    {programs[window.id].icon}
                  </span>
                  <span>{programs[window.id].content}</span>
                </span>
                <strong>{programs[window.id].name}</strong>
                <small>
                  {chosen ? '✓ Selecionada' : 'Não selecionada'}
                  {window.minimized && ' · Minimizada'}
                </small>
              </>
            );
            return (
              <li key={window.id}>
                {taskView ? (
                  <button
                    ref={chosen ? selectedButton : undefined}
                    className={`preview-card ${chosen ? 'selected' : ''}`}
                    aria-pressed={chosen}
                    onFocus={() => setSelection(window.id)}
                    onClick={() => onActivate(window.id)}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    className={`preview-card ${chosen ? 'selected' : ''}`}
                    aria-current={chosen ? 'true' : undefined}
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!taskView && (
          <div className="program-actions">
            <button
              className="guided"
              disabled={!selected}
              onClick={() => cycle(1)}
            >
              Tab
            </button>
            <button
              disabled={!selected}
              onClick={() => {
                if (selected) onActivate(selected.id);
              }}
            >
              Soltar Alt
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
