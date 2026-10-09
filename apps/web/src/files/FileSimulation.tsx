import { useEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { FileActivity } from './Files';

type SavedFile = { name: string; location: string; content: string };
type Overlay =
  | { kind: 'file-menu' | 'context' | 'delete' }
  | { kind: 'save'; name: string; location: string }
  | { kind: 'rename'; name: string }
  | null;

export function FileSimulation({
  activity,
  activityRoot,
  onComplete,
}: {
  activity: FileActivity;
  activityRoot: RefObject<HTMLDivElement | null>;
  onComplete: (result: string) => void;
}) {
  const editing = activity === 'create' || activity === 'save';
  const [text, setText] = useState(
    activity === 'create' ? 'Anotações anteriores' : '',
  );
  const [file, setFile] = useState<SavedFile | null>(
    editing
      ? null
      : {
          name: 'ideias.txt',
          location: 'Área de Trabalho',
          content: 'Ideias para o projeto',
        },
  );
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const fileButton = useRef<HTMLButtonElement>(null);
  const firstContextAction = useRef<HTMLButtonElement>(null);
  const renameInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const folder = useRef<HTMLElement>(null);
  const dirty = file !== null && text !== file.content;

  useEffect(() => {
    if (overlay?.kind === 'save' || overlay?.kind === 'delete')
      dialog.current?.showModal();
    if (overlay?.kind === 'context') firstContextAction.current?.focus();
    if (overlay?.kind === 'rename') renameInput.current?.select();
  }, [overlay?.kind]);

  function dismiss() {
    flushSync(() => setOverlay(null));
    if (editing) editor.current?.focus();
    else fileButton.current?.focus();
  }
  function saveAs() {
    setOverlay({
      kind: 'save',
      name: file?.name ?? '',
      location: file?.location ?? 'Área de Trabalho',
    });
  }
  function save() {
    if (!file) {
      saveAs();
      return;
    }
    setFile({ ...file, content: text });
    setOverlay(null);
    setFeedback('Salvo.');
    if (dirty)
      setResult(
        'Você salvou o arquivo e suas alterações sem abrir outro diálogo.',
      );
    editor.current?.focus();
  }
  function rename(name: string) {
    if (!file) return;
    const nextName = name.trim();
    if (nextName && nextName !== file.name) {
      setFile({ ...file, name: nextName });
      setFeedback(`Arquivo renomeado para ${nextName}.`);
      if (activity === 'rename')
        setResult('Você renomeou o arquivo pelo menu de contexto.');
    }
    dismiss();
  }

  useEffect(() => {
    if (activity !== 'save') return;
    const root = activityRoot.current;
    function handleSave(event: KeyboardEvent) {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (overlay?.kind !== 'save' && !event.repeat) save();
      }
    }
    root?.addEventListener('keydown', handleSave);
    return () => root?.removeEventListener('keydown', handleSave);
  });

  const instruction =
    activity === 'create'
      ? 'Abra Arquivo > Novo. O documento deve ficar vazio, com o título Sem título.'
      : activity === 'save'
        ? !file
          ? 'Escreva uma frase. Use Arquivo > Salvar como, Salvar ou Ctrl + S e escolha um nome e um local.'
          : dirty
            ? 'Use Arquivo > Salvar ou Ctrl + S. Suas alterações serão salvas sem outro diálogo.'
            : 'Faça uma pequena alteração no texto e salve novamente.'
        : activity === 'rename'
          ? 'Clique com o botão direito no arquivo e escolha Renomear. Digite outro nome, como projeto.txt, e confirme com Enter ou clicando fora.'
          : 'Clique com o botão direito no arquivo e escolha Excluir. Escolher “Não” preserva o arquivo; “Sim” confirma a exclusão.';

  return (
    <div
      className="scenario-grid"
      onKeyDown={(event) => {
        if (
          event.key === 'Escape' &&
          overlay &&
          overlay.kind !== 'save' &&
          overlay.kind !== 'delete'
        ) {
          event.stopPropagation();
          dismiss();
        }
      }}
    >
      <aside className="instructions" aria-label="Instruções da atividade">
        <p className="eyebrow">{result ? 'Objetivo alcançado' : 'Sua vez'}</p>
        <h2>
          {activity === 'create'
            ? 'Crie um documento em branco'
            : activity === 'save'
              ? 'Salve seu documento'
              : activity === 'rename'
                ? 'Mude o nome do arquivo'
                : 'Exclua com confirmação'}
        </h2>
        <p>{result ?? instruction}</p>
        <details>
          <summary>Mostrar dica</summary>
          <p>
            {activity === 'create'
              ? 'O menu Arquivo fica acima do texto. Novo abre um documento em branco.'
              : activity === 'save'
                ? 'O menu Arquivo fica acima do texto. Ctrl + S também possui um botão simulado.'
                : 'Pelo teclado, use Shift + F10 no arquivo ou o botão Opções do arquivo.'}
          </p>
        </details>
        {result && (
          <button className="primary" onClick={() => onComplete(result)}>
            Concluir atividade
          </button>
        )}
      </aside>
      <section className="file-simulator" aria-label="Simulação de Arquivos">
        {activity === 'save' && (
          <div
            className="shortcut-tray"
            role="group"
            aria-label="Atalhos simulados"
          >
            <span>Atalho simulado</span>
            <button className="guided" onClick={save}>
              Ctrl + S
            </button>
          </div>
        )}
        {editing ? (
          <section className="file-notepad" aria-label="Bloco de Notas">
            <header className="file-titlebar">
              <span className="program-icon" aria-hidden="true">
                N
              </span>
              <h2>{file?.name ?? 'Sem título'} — Bloco de Notas</h2>
            </header>
            <div className="file-menu">
              <button
                aria-expanded={overlay?.kind === 'file-menu'}
                aria-controls="notepad-actions"
                onClick={() =>
                  setOverlay(
                    overlay?.kind === 'file-menu'
                      ? null
                      : { kind: 'file-menu' },
                  )
                }
              >
                Arquivo
              </button>
              {overlay?.kind === 'file-menu' && (
                <div
                  id="notepad-actions"
                  className="file-menu-actions"
                  role="group"
                  aria-label="Opções de Arquivo"
                >
                  {activity === 'create' ? (
                    <button
                      onClick={() => {
                        setText('');
                        setFile(null);
                        dismiss();
                        setFeedback('Novo documento em branco criado.');
                        setResult(
                          'Você criou um novo documento vazio com o título Sem título.',
                        );
                      }}
                    >
                      Novo
                    </button>
                  ) : (
                    <>
                      <button onClick={save}>Salvar</button>
                      <button onClick={saveAs}>Salvar como</button>
                    </>
                  )}
                </div>
              )}
            </div>
            <label className="file-editor-label" htmlFor="notepad-content">
              Conteúdo do Bloco de Notas
            </label>
            <textarea
              id="notepad-content"
              ref={editor}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </section>
        ) : null}
        {(file || !editing) && (
          <section
            ref={folder}
            tabIndex={-1}
            className="file-folder"
            aria-label="Pasta simulada"
          >
            <h2>{editing ? 'Arquivo salvo' : 'Explorador de Arquivos'}</h2>
            <p className="file-path">
              Este Computador / {file?.location ?? 'Área de Trabalho'}
            </p>
            {file ? (
              <>
                <div className="file-item">
                  {overlay?.kind === 'rename' ? (
                    <>
                      <label htmlFor="rename-file">Novo nome do arquivo</label>
                      <input
                        id="rename-file"
                        className="guided"
                        ref={renameInput}
                        value={overlay.name}
                        onChange={(event) =>
                          setOverlay({
                            kind: 'rename',
                            name: event.target.value,
                          })
                        }
                        onBlur={(event) => rename(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            rename(event.currentTarget.value);
                          }
                        }}
                      />
                    </>
                  ) : (
                    <button
                      ref={fileButton}
                      className="file-icon-button"
                      onContextMenu={(event) => {
                        if (editing) return;
                        event.preventDefault();
                        setOverlay({ kind: 'context' });
                      }}
                      onKeyDown={(event) => {
                        if (
                          !editing &&
                          ((event.shiftKey && event.key === 'F10') ||
                            event.key === 'ContextMenu')
                        ) {
                          event.preventDefault();
                          setOverlay({ kind: 'context' });
                        }
                      }}
                    >
                      <span className="program-icon" aria-hidden="true">
                        TXT
                      </span>
                      <span>{file.name}</span>
                    </button>
                  )}
                  {!editing && (
                    <button
                      aria-expanded={overlay?.kind === 'context'}
                      onClick={() =>
                        setOverlay(
                          overlay?.kind === 'context'
                            ? null
                            : { kind: 'context' },
                        )
                      }
                    >
                      Opções do arquivo
                    </button>
                  )}
                  {overlay?.kind === 'context' && (
                    <div
                      className="file-context"
                      role="group"
                      aria-label="Menu de contexto"
                    >
                      {activity === 'rename' ? (
                        <button
                          ref={firstContextAction}
                          onClick={() =>
                            setOverlay({ kind: 'rename', name: file.name })
                          }
                        >
                          Renomear
                        </button>
                      ) : (
                        <button
                          ref={firstContextAction}
                          onClick={() => setOverlay({ kind: 'delete' })}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {editing && (
                  <details className="saved-content">
                    <summary>Ver conteúdo salvo</summary>
                    <pre aria-label="Conteúdo salvo">{file.content}</pre>
                  </details>
                )}
              </>
            ) : (
              <p>O arquivo foi removido da pasta.</p>
            )}
          </section>
        )}
        <p className="sim-feedback" role="status">
          {feedback || 'Ambiente de treino: os arquivos são temporários.'}
        </p>
      </section>
      {overlay?.kind === 'save' && (
        <dialog
          ref={dialog}
          className="file-dialog"
          aria-labelledby="save-title"
          onCancel={dismiss}
        >
          <h2 id="save-title">Salvar como</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const name = overlay.name.trim();
              if (!name) return;
              setFile({ name, location: overlay.location, content: text });
              dismiss();
              setFeedback(`Arquivo salvo como ${name} em ${overlay.location}.`);
            }}
          >
            <label htmlFor="save-name">Nome do arquivo</label>
            <input
              id="save-name"
              autoFocus
              required
              value={overlay.name}
              onChange={(event) =>
                setOverlay({ ...overlay, name: event.target.value })
              }
            />
            <label htmlFor="save-location">Local</label>
            <select
              id="save-location"
              value={overlay.location}
              onChange={(event) =>
                setOverlay({ ...overlay, location: event.target.value })
              }
            >
              <option>Área de Trabalho</option>
              <option>Documentos</option>
            </select>
            <div className="program-actions">
              <button type="button" onClick={dismiss}>
                Cancelar
              </button>
              <button type="submit" disabled={!overlay.name.trim()}>
                Salvar
              </button>
            </div>
          </form>
        </dialog>
      )}
      {overlay?.kind === 'delete' && file && (
        <dialog
          ref={dialog}
          className="file-dialog"
          aria-labelledby="delete-title"
          onCancel={dismiss}
        >
          <h2 id="delete-title">Excluir arquivo</h2>
          <p>Deseja excluir {file.name} da pasta simulada?</p>
          <div className="program-actions">
            <button autoFocus onClick={dismiss}>
              Não
            </button>
            <button
              onClick={() => {
                flushSync(() => {
                  setFile(null);
                  setOverlay(null);
                });
                folder.current?.focus();
                setFeedback('Arquivo excluído da pasta simulada.');
                if (activity === 'delete')
                  setResult('Você excluiu o arquivo após confirmar a ação.');
              }}
            >
              Sim
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
