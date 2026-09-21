import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { Activity, Method } from './Programs';
import { OpenProgram } from './OpenProgram';
import { ProgramWindow } from './ProgramWindow';
import { CloseProgram } from './CloseProgram';
import { SwitchPrograms } from './SwitchPrograms';
import { programs, type OpenWindow, type ProgramId } from './windows';

const instructions: Record<Method, string> = {
  start: 'Abra o Menu Iniciar, pesquise “Bloco” e clique no resultado.',
  search: 'Use o controle Win + S, digite “Bloco” e abra o resultado.',
  desktop:
    'Clique uma vez para selecionar o ícone. Dê dois cliques rápidos para abrir. Pelo teclado, selecione com Espaço e abra com Enter.',
  close: 'Use o botão X no canto superior direito da janela.',
  'alt-f4':
    'Use o controle Alt + F4 para fechar a janela ativa. Uma janela minimizada continua aberta.',
  'task-manager':
    'Use Ctrl + Shift + Esc, selecione o Bloco de Notas e finalize a tarefa. Neste exercício ele não está respondendo: confirme o fechamento.',
  'alt-tab':
    'Use Alt + Tab, percorra as janelas com o botão Tab e confirme em Soltar Alt. A seleção só será ativada ao soltar Alt na simulação.',
  'task-view':
    'Use Win + Tab. Selecione o Navegador por clique ou com as setas e Enter. Esc ou a área vazia sai sem trocar de janela.',
};

export function ProgramSimulation({
  activity,
  method,
  onComplete,
}: {
  activity: Activity;
  method: Method;
  onComplete: (result: string) => void;
}) {
  const [windows, setWindows] = useState<OpenWindow[]>(() => {
    if (activity === 'open') return [];
    const initial: OpenWindow[] = [
      {
        id: 'notepad',
        maximized: false,
        minimized: false,
        status: method === 'task-manager' ? 'unresponsive' : 'running',
      },
    ];
    if (method === 'task-manager' || activity === 'switch')
      initial.unshift({
        id: 'browser',
        maximized: false,
        minimized: activity !== 'switch',
        status: 'running',
      });
    return initial;
  });
  const [selectedIcon, setSelectedIcon] = useState<ProgramId | null>(null);
  const [overlay, setOverlay] = useState<
    'start' | 'search' | 'task-manager' | 'alt-tab' | 'task-view' | null
  >(null);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const desktop = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const active = windows.findLast((window) => !window.minimized)?.id;
  const switching = overlay === 'alt-tab' || overlay === 'task-view';

  function activate(id: ProgramId) {
    setWindows((current) => {
      if (current.findLast((window) => !window.minimized)?.id === id)
        return current;
      const target = current.find((window) => window.id === id);
      return target
        ? [
            ...current.filter((window) => window.id !== id),
            { ...target, minimized: false },
          ]
        : current;
    });
  }
  function dismiss() {
    setOverlay(null);
    desktop.current?.focus();
  }
  function open(id: ProgramId, source: Method) {
    setWindows((current) => [
      ...current.filter((window) => window.id !== id),
      { id, maximized: true, minimized: false, status: 'running' },
    ]);
    setOverlay(null);
    setFeedback(`${programs[id].name} aberto em uma janela maximizada.`);
    if (activity === 'open' && id === 'notepad' && source === method)
      setResult(
        'Você abriu o Bloco de Notas. Experimente também os outros métodos.',
      );
  }
  function close(id: ProgramId, source: Method) {
    function removeWindow() {
      setWindows((current) => current.filter((window) => window.id !== id));
      setFeedback(`${programs[id].name} fechado.`);
      if (activity === 'close' && id === 'notepad' && source === method)
        setResult(
          'Você fechou o Bloco de Notas. A janela foi removida dos programas abertos.',
        );
      desktop.current?.focus();
    }
    if (
      source === 'close' &&
      document.startViewTransition &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      document.startViewTransition(() => flushSync(removeWindow));
    } else {
      removeWindow();
    }
  }

  function switchTo(id: ProgramId) {
    activate(id);
    setOverlay(null);
    setFeedback(`${programs[id].name} agora é a janela ativa.`);
    if (activity === 'switch' && id === 'browser' && overlay === method)
      setResult(
        'Você alternou para o Navegador. A outra janela continua aberta.',
      );
  }

  return (
    <div className="scenario-grid">
      <aside className="instructions" aria-label="Instruções da atividade">
        <p className="eyebrow">{result ? 'Objetivo alcançado' : 'Sua vez'}</p>
        <h2>
          {activity === 'switch'
            ? 'Vá para o Navegador'
            : activity === 'open'
              ? 'Abra o Bloco de Notas'
              : 'Feche o Bloco de Notas'}
        </h2>
        <p>{instructions[method]}</p>
        <details>
          <summary>Mostrar dica</summary>
          <p>
            O controle indicado tem contorno destacado. Todos os atalhos são
            simulados pelos botões desta página.
          </p>
        </details>
        {result && (
          <button className="primary" onClick={() => onComplete(result)}>
            Concluir atividade
          </button>
        )}
      </aside>
      <section className="simulator" aria-label="Simulação interativa">
        <div
          className="shortcut-tray"
          role="group"
          aria-label="Atalhos simulados"
        >
          <span>Atalhos simulados</span>
          <button
            className={method === 'search' ? 'guided' : ''}
            onClick={() => {
              setOverlay('search');
              searchInput.current?.focus();
            }}
          >
            Win + S
          </button>
          {activity !== 'open' && (
            <>
              <button
                disabled={switching}
                className={method === 'alt-f4' ? 'guided' : ''}
                onClick={() =>
                  active
                    ? close(active, 'alt-f4')
                    : setFeedback(
                        'Nenhuma janela ativa para fechar. Restaure um programa pela barra de tarefas.',
                      )
                }
              >
                Alt + F4
              </button>
              <button
                className={method === 'task-manager' ? 'guided' : ''}
                onClick={() => setOverlay('task-manager')}
              >
                Ctrl + Shift + Esc
              </button>
            </>
          )}
          {activity === 'switch' && (
            <>
              <button
                className={method === 'alt-tab' ? 'guided' : ''}
                onClick={() => setOverlay('alt-tab')}
              >
                Alt + Tab
              </button>
              <button
                className={method === 'task-view' ? 'guided' : ''}
                onClick={() => setOverlay('task-view')}
              >
                Win + Tab
              </button>
            </>
          )}
        </div>
        <div
          ref={desktop}
          tabIndex={-1}
          className="desktop"
          aria-label="Área de trabalho simulada"
        >
          <div
            className="desktop-icons"
            inert={Boolean(overlay) || Boolean(active)}
            role="group"
            aria-label="Ícones da área de trabalho"
          >
            {(Object.keys(programs) as ProgramId[]).map((id) => (
              <button
                key={id}
                aria-pressed={selectedIcon === id}
                className={`desktop-icon ${method === 'desktop' && id === 'notepad' ? 'guided' : ''}`}
                onClick={() => setSelectedIcon(id)}
                onDoubleClick={() => open(id, 'desktop')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    open(id, 'desktop');
                  }
                }}
              >
                <span className="program-icon" aria-hidden="true">
                  {programs[id].icon}
                </span>
                {programs[id].name}
                {selectedIcon === id && <small>✓ Selecionado</small>}
              </button>
            ))}
          </div>
          {windows.map((window, index) => (
            <ProgramWindow
              key={window.id}
              window={window}
              order={index}
              active={active === window.id}
              onActivate={() => activate(window.id)}
              onMinimize={() => {
                setWindows((current) =>
                  current.map((item) =>
                    item.id === window.id ? { ...item, minimized: true } : item,
                  ),
                );
                setFeedback(
                  `${programs[window.id].name} minimizado. Use a barra de tarefas para restaurar.`,
                );
                desktop.current?.focus();
              }}
              onMaximize={() =>
                setWindows((current) =>
                  current.map((item) =>
                    item.id === window.id
                      ? { ...item, maximized: !item.maximized }
                      : item,
                  ),
                )
              }
              onClose={() => close(window.id, 'close')}
              guideClose={method === 'close' && window.id === 'notepad'}
              obscured={Boolean(overlay)}
            />
          ))}
          {(overlay === 'start' || overlay === 'search') && (
            <OpenProgram
              key={overlay}
              inputRef={searchInput}
              start={overlay === 'start'}
              onOpen={(id) => open(id, overlay)}
              onDismiss={dismiss}
              onFeedback={setFeedback}
            />
          )}
          {overlay === 'task-manager' && (
            <CloseProgram
              windows={windows}
              onClose={(id) => close(id, 'task-manager')}
              onDismiss={dismiss}
            />
          )}
          {(overlay === 'alt-tab' || overlay === 'task-view') && (
            <SwitchPrograms
              key={overlay}
              mode={overlay}
              windows={windows}
              active={active}
              onActivate={switchTo}
              onDismiss={dismiss}
            />
          )}
        </div>
        <div className="taskbar" role="group" aria-label="Barra de tarefas">
          <button
            disabled={switching}
            className={method === 'start' ? 'guided' : ''}
            aria-expanded={overlay === 'start'}
            onClick={() => setOverlay(overlay === 'start' ? null : 'start')}
          >
            ⊞ Iniciar
          </button>
          {windows.map((window) => (
            <button
              key={window.id}
              disabled={switching}
              aria-pressed={active === window.id}
              onClick={() => {
                activate(window.id);
                setFeedback(
                  `${programs[window.id].name} agora é a janela ativa.`,
                );
              }}
            >
              {programs[window.id].name}
              {window.minimized && ' (minimizado)'}
            </button>
          ))}
        </div>
        <p className="sim-feedback" role="status">
          {feedback ||
            'Ambiente de treino: nenhuma ação altera seu computador.'}
        </p>
      </section>
    </div>
  );
}
