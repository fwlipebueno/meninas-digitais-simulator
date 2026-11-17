import { useEffect, useRef, useState, type ReactNode } from 'react';

const menuTour = [
  ['Arquivo', 'Cria, salva, abre e exporta documentos.'],
  ['Editar', 'Reúne ações como desfazer, copiar e colar.'],
  ['Ver', 'Controla os modos de visualização.'],
  ['Inserir', 'Adiciona links, tabelas e imagens.'],
  ['Formatar', 'Altera a aparência e a organização do texto.'],
  ['Ferramentas', 'Reúne recursos como revisão ortográfica.'],
  ['Ajuda', 'Dá acesso a informações de suporte do editor.'],
] as const;
const toolTour = [
  ['Desfazer', 'Desfaz a última alteração.', '↶'],
  ['Refazer', 'Refaz uma alteração desfeita.', '↷'],
  ['Zoom', 'Ajusta o tamanho da visualização.', '100%'],
  [
    'Estilos',
    'Organiza o texto em Título, Subtítulo e Texto normal.',
    'Texto normal',
  ],
  ['Fonte', 'Define o desenho das letras.', 'Arial'],
  ['Tamanho', 'Altera o tamanho das letras.', '14'],
  ['Negrito', 'Dá maior destaque ao texto.', <strong>B</strong>],
  ['Itálico', 'Inclina as letras para dar ênfase.', <em>I</em>],
  ['Sublinhado', 'Adiciona uma linha abaixo do texto.', <u>U</u>],
  [
    'Alinhamento',
    'Organiza o texto à esquerda, ao centro, à direita ou justificado.',
    '≡',
  ],
  ['Listas', 'Organiza itens com marcadores ou números.', '☷'],
] as const;

export function DocsLesson({
  instruction,
  feedback,
  error = false,
  result,
  onComplete,
  children,
}: {
  instruction: string;
  feedback?: string;
  error?: boolean;
  result?: string;
  onComplete: (result: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="scenario-grid docs-scenario">
      <aside className="instructions" aria-label="Instruções da atividade">
        <p className="eyebrow">{result ? 'Objetivo alcançado' : 'Sua vez'}</p>
        <h2>Pratique no editor</h2>
        <p id="docs-instruction">{result ?? instruction}</p>
        <p>
          Este é um documento de treino. Nenhum arquivo ou convite real será
          criado.
        </p>
        <button
          className="primary"
          disabled={!result}
          onClick={() => {
            if (result) onComplete(result);
          }}
        >
          Concluir atividade
        </button>
      </aside>
      <section className="docs-simulator" aria-label="Simulação de Google Docs">
        {children}
        {feedback && (
          <p
            className={`docs-feedback ${error ? 'error' : ''}`}
            role={error ? 'alert' : 'status'}
          >
            {feedback}
          </p>
        )}
      </section>
    </div>
  );
}

export function DocsEditor({
  title = 'Meu projeto Technovation',
  onTitleChange,
  highlight,
  tooltip,
  onMenu,
  menu,
  toolbar,
  headerAction,
  zoom = 100,
  children,
}: {
  title?: string;
  onTitleChange?: (value: string) => void;
  highlight?: string;
  tooltip?: string;
  onMenu?: Partial<Record<(typeof menuTour)[number][0], () => void>>;
  menu?: ReactNode;
  toolbar?: ReactNode;
  headerAction?: ReactNode;
  zoom?: number;
  children: ReactNode;
}) {
  const hint = tooltip && (
    <span
      id="docs-tooltip"
      className="docs-tooltip"
      role="tooltip"
      aria-live="polite"
    >
      {tooltip}
    </span>
  );
  return (
    <section
      className="docs-editor"
      aria-label="Editor do documento"
      tabIndex={-1}
    >
      <header className="docs-header">
        <div className="docs-title-row">
          {onTitleChange ? (
            <label
              className="docs-title-field"
              data-guided={highlight === 'Título do documento'}
            >
              Título do documento
              <input
                aria-label="Título do documento"
                aria-describedby={
                  highlight === 'Título do documento'
                    ? 'docs-tooltip'
                    : 'docs-instruction'
                }
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
              />
              {highlight === 'Título do documento' && hint}
            </label>
          ) : (
            <strong>{title}</strong>
          )}
          {headerAction}
        </div>
        <h2 className="docs-window-title">{title} — Google Docs</h2>
      </header>
      <div className="docs-menus" aria-label="Menus do editor">
        {menuTour.map(([name]) =>
          onMenu?.[name] ? (
            <button
              key={name}
              data-guided={highlight === name}
              onClick={onMenu[name]}
            >
              {name}
            </button>
          ) : (
            <span
              key={name}
              data-guided={highlight === name}
              aria-describedby={highlight === name ? 'docs-tooltip' : undefined}
            >
              {name}
              {highlight === name && hint}
            </span>
          ),
        )}
      </div>
      {menu && (
        <div
          className="docs-menu-content"
          role="group"
          aria-label="Opções do menu"
        >
          {menu}
        </div>
      )}
      <div
        className="docs-toolbar"
        role="group"
        aria-label="Barra de ferramentas"
      >
        {toolbar ??
          toolTour.map(([name, , icon]) => (
            <span
              key={name}
              data-guided={highlight === name}
              aria-describedby={highlight === name ? 'docs-tooltip' : undefined}
            >
              <span role="img" aria-label={name}>
                {icon}
              </span>
              <span aria-hidden="true"> {name}</span>
              {highlight === name && hint}
            </span>
          ))}
      </div>
      <div
        className="docs-ruler"
        aria-label="Régua horizontal"
        data-guided={highlight === 'Régua'}
      >
        {[1, 2, 3, 4, 5, 6, 7].map((number) => (
          <span key={number}>{number}</span>
        ))}
        {highlight === 'Régua' && hint}
      </div>
      <div className="docs-canvas">
        <article
          className="docs-paper"
          aria-label="Documento simulado"
          style={{ fontSize: `${(16 * zoom) / 100}px` }}
        >
          {children}
        </article>
      </div>
    </section>
  );
}

export function DocsDialog({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const editor = previous?.closest<HTMLElement>('.docs-editor');
    element?.showModal();
    return () => {
      element?.close();
      if (previous?.isConnected && !previous.matches(':disabled'))
        previous.focus();
      else editor?.focus();
    };
  }, []);
  return (
    <dialog
      className="docs-dialog"
      ref={dialog}
      aria-labelledby="docs-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="docs-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}

export function InterfaceActivity({
  onComplete,
}: {
  onComplete: (result: string) => void;
}) {
  const [title, setTitle] = useState('Meu projeto Technovation');
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState('');
  const current =
    step >= 1 && step <= 7
      ? menuTour[step - 1]
      : step >= 9 && step <= 19
        ? toolTour[step - 9]
        : null;
  const instruction =
    step === 0
      ? 'O título identifica o documento. Clique no campo e escreva um nome diferente.'
      : step === 8
        ? 'A régua ajuda a ajustar margens, recuos e tabulações. Observe o destaque e continue.'
        : current
          ? `${current[0]}: ${current[1]} Observe o destaque e continue.`
          : 'Você conheceu os principais elementos do editor.';
  return (
    <DocsLesson
      instruction={instruction}
      feedback={feedback}
      result={
        step === 20
          ? 'Você alterou o título e conheceu menus, régua e ferramentas.'
          : undefined
      }
      onComplete={onComplete}
    >
      <DocsEditor
        title={title}
        onTitleChange={setTitle}
        tooltip={step < 20 ? instruction : undefined}
        highlight={
          step === 0
            ? 'Título do documento'
            : step === 8
              ? 'Régua'
              : current?.[0]
        }
      >
        <h3>Projeto Technovation</h3>
        <p>
          Este projeto organiza as ideias da equipe e a solução para a
          comunidade.
        </p>
      </DocsEditor>
      {step < 20 && (
        <button
          className="docs-next"
          onClick={() => {
            if (
              step === 0 &&
              (!title.trim() || title.trim() === 'Meu projeto Technovation')
            ) {
              setFeedback('Altere o título para continuar.');
              return;
            }
            if (step === 0) setFeedback('Título alterado!');
            else setFeedback('');
            setStep(step + 1);
          }}
        >
          Continuar
        </button>
      )}
    </DocsLesson>
  );
}

export function ExportActivity({
  onComplete,
}: {
  onComplete: (result: string) => void;
}) {
  const [menu, setMenu] = useState<'file' | 'formats' | null>('file');
  const [format, setFormat] = useState<'PDF' | 'DOCX' | 'TXT' | null>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!format || progress === 100) return;
    const timer = window.setTimeout(
      () => setProgress((value) => Math.min(100, value + 25)),
      120,
    );
    return () => window.clearTimeout(timer);
  }, [format, progress]);
  const done = progress === 100;
  return (
    <DocsLesson
      instruction="Abra Arquivo > Fazer download e escolha PDF, DOCX ou TXT."
      feedback={done ? 'Download concluído!' : undefined}
      result={
        done
          ? `Você exportou o documento em ${format} para Downloads simulados.`
          : undefined
      }
      onComplete={onComplete}
    >
      <DocsEditor
        highlight={!format ? 'Arquivo' : undefined}
        onMenu={{
          Arquivo: () => {
            if (!format) setMenu(menu ? null : 'file');
          },
        }}
        menu={
          menu === 'file' ? (
            <button data-guided onClick={() => setMenu('formats')}>
              Fazer download
            </button>
          ) : menu === 'formats' ? (
            <div role="group" aria-label="Formatos de exportação">
              {(['PDF', 'DOCX', 'TXT'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setFormat(value);
                    setMenu(null);
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        <h3>Projeto Technovation</h3>
        <p>Ideias da equipe para transformar a comunidade.</p>
      </DocsEditor>
      {format && (
        <section aria-label="Exportação simulada">
          <p>
            Formato selecionado: <strong>{format}</strong>
          </p>
          <progress
            aria-label="Progresso da exportação"
            value={progress}
            max={100}
          />
          {done && (
            <p>
              Downloads simulados: Meu projeto Technovation.
              {format.toLowerCase()}
            </p>
          )}
        </section>
      )}
    </DocsLesson>
  );
}
