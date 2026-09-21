import { useEffect, useRef, useState } from 'react';
import { programs, type OpenWindow, type ProgramId } from './windows';

export function CloseProgram({
  windows,
  onClose,
  onDismiss,
}: {
  windows: OpenWindow[];
  onClose: (id: ProgramId) => void;
  onDismiss: () => void;
}) {
  const [selection, setSelection] = useState<{
    id: ProgramId;
    confirming: boolean;
  } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const selected = windows.find((window) => window.id === selection?.id);
  const confirming = Boolean(selected && selection?.confirming);
  useEffect(() => {
    if (confirming) confirmation.current?.showModal();
    else heading.current?.focus();
  }, [confirming]);

  function finish(id: ProgramId) {
    onClose(id);
    setSelection(null);
    heading.current?.focus();
  }

  return (
    <section
      className="task-manager"
      aria-label="Gerenciador de Tarefas"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !confirming) onDismiss();
      }}
    >
      <div className="panel-heading">
        <h2 ref={heading} tabIndex={-1}>
          Gerenciador de Tarefas
        </h2>
        <button aria-label="Fechar Gerenciador de Tarefas" onClick={onDismiss}>
          ×
        </button>
      </div>
      <fieldset>
        <legend>Programas abertos</legend>
        {windows.length === 0 && <p>Nenhum programa aberto.</p>}
        {windows.map((window) => (
          <label
            key={window.id}
            className={`task-row ${selected?.id === window.id ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="task"
              value={window.id}
              checked={selected?.id === window.id}
              onChange={() =>
                setSelection({ id: window.id, confirming: false })
              }
            />
            <span className="program-icon" aria-hidden="true">
              {programs[window.id].icon}
            </span>
            <span>
              {programs[window.id].name}
              <small>
                {window.status === 'unresponsive'
                  ? 'Não está respondendo'
                  : 'Em execução'}
                {window.minimized && ' · Minimizado'}
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      <button
        className="primary"
        disabled={!selected}
        onClick={() => {
          if (!selected) return;
          if (selected.status === 'unresponsive')
            setSelection({ id: selected.id, confirming: true });
          else finish(selected.id);
        }}
      >
        Finalizar tarefa
      </button>
      {confirming && selected && (
        <dialog
          ref={confirmation}
          className="task-confirmation"
          aria-labelledby="confirm-title"
          onCancel={() => setSelection({ id: selected.id, confirming: false })}
        >
          <h2 id="confirm-title">Finalizar {programs[selected.id].name}?</h2>
          <p>
            O programa não está respondendo. Finalizar tarefa fechará sua janela
            simulada.
          </p>
          <div className="program-actions">
            <button
              autoFocus
              onClick={() =>
                setSelection({ id: selected.id, confirming: false })
              }
            >
              Cancelar
            </button>
            <button onClick={() => finish(selected.id)}>
              Confirmar finalização
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}
