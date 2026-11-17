import { useState } from 'react';
import { DocsDialog, DocsEditor, DocsLesson } from './DocsSimulation';

export function EditorTools({
  onComplete,
}: {
  onComplete: (result: string) => void;
}) {
  const [step, setStep] = useState<
    'zoom' | 'find' | 'share' | 'spell' | 'styles' | 'apply' | 'toc' | 'done'
  >('zoom');
  const [zoom, setZoom] = useState(100);
  const [dialog, setDialog] = useState<'find' | 'share' | 'spell' | null>(null);
  const [menu, setMenu] = useState<'tools' | 'insert' | null>(null);
  const [query, setQuery] = useState('');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('Leitor');
  const [shared, setShared] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [selected, setSelected] = useState(false);
  const [paragraphs, setParagraphs] = useState<
    {
      id: string;
      text: string;
      style: 'Título' | 'Texto normal';
    }[]
  >([
    { id: 'project-title', text: 'Projeto Technovation', style: 'Título' },
    {
      id: 'community-title',
      text: 'Solução para a comunidade',
      style: 'Texto normal',
    },
    {
      id: 'project-body',
      text: 'Este projeto organiza as ideias da equipe e a solução para a comunidade.',
      style: 'Texto normal',
    },
  ]);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(false);
  const instructions = {
    zoom: 'Altere o zoom para 125%. A visualização deve aumentar.',
    find: 'Acione Ctrl + F no botão simulado. Procure a palavra projeto.',
    share: 'Clique em Compartilhar. Informe um e-mail e escolha uma permissão.',
    spell:
      'Abra Ferramentas > Ortografia e gramática e corrija a palavra destacada.',
    styles:
      'Texto normal é usado nos parágrafos. Título identifica seções principais; Subtítulo organiza níveis abaixo do título. Observe a galeria de estilos e continue.',
    apply:
      'Selecione o parágrafo Solução para a comunidade e escolha Título na galeria.',
    toc: 'Abra Inserir > Índice para criar um sumário a partir dos títulos no cursor indicado.',
    done: 'O sumário foi inserido. Clique em um item para navegar até o título.',
  };
  const search = query.trim().toLowerCase();
  const spellingWord = fixed ? 'tecnologia' : 'tecnlogia';
  const spellingText = `A ${spellingWord} ajuda a transformar uma ideia em solução.`;
  const occurrences = search
    ? [...paragraphs.map((p) => p.text), spellingText].reduce(
        (total, text) => total + text.toLowerCase().split(search).length - 1,
        0,
      )
    : 0;
  const headings = paragraphs.filter((p) => p.style !== 'Texto normal');
  function textWithMatches(text: string, spelling = false) {
    function fragment(start: number, end: number) {
      const wordStart = text.indexOf(spellingWord);
      const wordEnd = wordStart + spellingWord.length;
      if (!spelling || end <= wordStart || start >= wordEnd)
        return text.slice(start, end);
      const from = Math.max(start, wordStart);
      const to = Math.min(end, wordEnd);
      return (
        <>
          {text.slice(start, from)}
          <span className={!fixed ? 'docs-misspelled' : undefined}>
            {text.slice(from, to)}
          </span>
          {text.slice(to, end)}
        </>
      );
    }
    if (!search) return fragment(0, text.length);
    const parts = text.toLowerCase().split(search);
    let offset = 0;
    return parts.map((part, index) => {
      const start = offset;
      offset += part.length + search.length;
      return (
        <span key={index}>
          {fragment(start, start + part.length)}
          {index < parts.length - 1 && (
            <mark>{fragment(start + part.length, offset)}</mark>
          )}
        </span>
      );
    });
  }
  function cancel() {
    setDialog(null);
    setError(false);
    setFeedback('');
  }
  const highlight =
    step === 'spell' ? 'Ferramentas' : step === 'toc' ? 'Inserir' : undefined;
  return (
    <DocsLesson
      instruction={instructions[step]}
      feedback={dialog ? undefined : feedback}
      error={error}
      result={
        step === 'done'
          ? 'Você usou zoom, busca, compartilhamento, revisão, estilos e sumário.'
          : undefined
      }
      onComplete={onComplete}
    >
      <DocsEditor
        zoom={zoom}
        highlight={highlight}
        headerAction={
          shared ? (
            <strong>Compartilhado</strong>
          ) : (
            <button
              data-guided={step === 'share'}
              disabled={step !== 'share'}
              onClick={() => setDialog('share')}
            >
              Compartilhar
            </button>
          )
        }
        onMenu={{
          Ferramentas: () => {
            if (step === 'spell') setMenu(menu ? null : 'tools');
          },
          Inserir: () => {
            if (step === 'toc') setMenu(menu ? null : 'insert');
          },
        }}
        menu={
          menu === 'tools' ? (
            <button data-guided onClick={() => setDialog('spell')}>
              Ortografia e gramática
            </button>
          ) : menu === 'insert' ? (
            <button
              data-guided
              onClick={() => {
                setStep('done');
                setMenu(null);
                setFeedback(
                  'Sumário inserido com base nos títulos do documento.',
                );
              }}
            >
              Índice
            </button>
          ) : undefined
        }
        toolbar={
          <>
            <label data-guided={step === 'zoom'}>
              Zoom
              <select
                aria-label="Zoom"
                value={zoom}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setZoom(value);
                  setFeedback(`Zoom alterado para ${value}%.`);
                  if (step === 'zoom' && value === 125) {
                    setStep('find');
                  }
                }}
              >
                {[90, 100, 125, 150].map((value) => (
                  <option key={value} value={value}>
                    {value}%
                  </option>
                ))}
              </select>
            </label>
            <label data-guided={step === 'styles' || step === 'apply'}>
              Estilo do parágrafo
              <select
                aria-label="Estilo do parágrafo"
                aria-describedby={
                  step === 'styles' ? 'docs-styles-tooltip' : undefined
                }
                disabled={step !== 'apply' || !selected}
                value={
                  paragraphs.find((p) => p.id === 'community-title')?.style ??
                  'Texto normal'
                }
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === 'Título') {
                    setParagraphs((prev) =>
                      prev.map((p) =>
                        p.id === 'community-title'
                          ? { ...p, style: 'Título' }
                          : p,
                      ),
                    );
                    setStep('toc');
                    setFeedback('Estilo Título aplicado.');
                  } else {
                    setFeedback(
                      'Nesta etapa, escolha Título para destacar o parágrafo selecionado.',
                    );
                  }
                }}
              >
                {['Texto normal', 'Título', 'Subtítulo'].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              {step === 'styles' && (
                <span
                  id="docs-styles-tooltip"
                  className="docs-tooltip"
                  role="tooltip"
                >
                  {instructions.styles}
                </span>
              )}
            </label>
            <button
              data-guided={step === 'find'}
              disabled={step !== 'find'}
              onClick={() => setDialog('find')}
            >
              Ctrl + F
            </button>
          </>
        }
      >
        {step === 'toc' && (
          <p
            className="docs-insertion-point"
            role="img"
            aria-label="Ponto de inserção do sumário"
          >
            │
          </p>
        )}
        {step === 'done' && (
          <nav aria-label="Sumário do documento">
            <strong>Sumário</strong>
            {headings.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  const target = document.getElementById(p.id);
                  target?.scrollIntoView({ block: 'center' });
                  target?.focus({ preventScroll: true });
                }}
              >
                {p.text}
              </a>
            ))}
          </nav>
        )}
        {paragraphs.map((p) =>
          p.style === 'Título' ? (
            <h3 key={p.id} id={p.id} tabIndex={-1}>
              {textWithMatches(p.text)}
            </h3>
          ) : p.id === 'community-title' && step === 'apply' ? (
            <p key={p.id}>
              <button
                aria-pressed={selected}
                data-guided
                onClick={() => {
                  setSelected(true);
                  setFeedback(
                    'Parágrafo selecionado. Escolha o estilo Título.',
                  );
                }}
              >
                {p.text}
              </button>
            </p>
          ) : (
            <p key={p.id} id={p.id}>
              {textWithMatches(p.text)}
            </p>
          ),
        )}
        <p>{textWithMatches(spellingText, true)}</p>
        {dialog && (
          <DocsDialog
            title={
              dialog === 'find'
                ? 'Localizar no documento'
                : dialog === 'share'
                  ? 'Compartilhar documento'
                  : 'Revisão ortográfica'
            }
            onCancel={cancel}
          >
            {dialog === 'find' ? (
              <>
                <label>
                  Localizar no documento
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
                <p role="status">
                  {occurrences}{' '}
                  {occurrences === 1 ? 'ocorrência' : 'ocorrências'}
                </p>
                <div className="program-actions">
                  <button onClick={cancel}>Fechar busca</button>
                  <button
                    disabled={search !== 'projeto' || occurrences === 0}
                    onClick={() => {
                      setDialog(null);
                      setStep('share');
                      setFeedback(
                        `${occurrences} ocorrências encontradas e destacadas.`,
                      );
                    }}
                  >
                    Continuar
                  </button>
                </div>
              </>
            ) : dialog === 'share' ? (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                    setError(true);
                    setFeedback('Digite um e-mail válido para compartilhar.');
                    return;
                  }
                  setShared(true);
                  setDialog(null);
                  setStep('spell');
                  setFeedback('Convite enviado!');
                  setError(false);
                }}
              >
                <label>
                  Pessoa ou e-mail
                  <input
                    value={email}
                    aria-invalid={error}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError(false);
                    }}
                  />
                </label>
                <label>
                  Permissão
                  <select
                    value={permission}
                    onChange={(event) => setPermission(event.target.value)}
                  >
                    {['Leitor', 'Comentador', 'Editor'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                {error && (
                  <p role="alert">Digite um e-mail válido para compartilhar.</p>
                )}
                <div className="program-actions">
                  <button type="button" onClick={cancel}>
                    Cancelar
                  </button>
                  <button type="submit">Enviar</button>
                </div>
              </form>
            ) : (
              <>
                <p>
                  Palavra: <strong>tecnlogia</strong>
                </p>
                <p>
                  Sugestão: <strong>tecnologia</strong>
                </p>
                <div className="program-actions">
                  <button
                    onClick={() => {
                      setDialog(null);
                      setFeedback(
                        'Sugestão ignorada. Você pode abrir a revisão novamente.',
                      );
                    }}
                  >
                    Ignorar
                  </button>
                  <button
                    onClick={() => {
                      setFixed(true);
                      setDialog(null);
                      setMenu(null);
                      setStep('styles');
                      setFeedback('Correção aplicada.');
                    }}
                  >
                    Aceitar
                  </button>
                </div>
              </>
            )}
          </DocsDialog>
        )}
      </DocsEditor>
      {step === 'styles' && (
        <button className="docs-next" onClick={() => setStep('apply')}>
          Continuar
        </button>
      )}
    </DocsLesson>
  );
}
