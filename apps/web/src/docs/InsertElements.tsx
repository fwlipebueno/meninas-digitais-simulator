import { useRef, useState } from 'react';
import logo from '../assets/meninas-digitais.png';
import { DocsDialog, DocsEditor, DocsLesson } from './DocsSimulation';

export function InsertElements({
  onComplete,
}: {
  onComplete: (result: string) => void;
}) {
  const [step, setStep] = useState<
    'link' | 'table' | 'cell' | 'image' | 'resize' | 'done'
  >('link');
  const [menu, setMenu] = useState(true);
  const [dialog, setDialog] = useState<'link' | 'grid' | 'gallery' | null>(
    null,
  );
  const [link, setLink] = useState({ text: '', url: '' });
  const [grid, setGrid] = useState({ rows: 1, cols: 1 });
  const [cell, setCell] = useState('');
  const [image, setImage] = useState<
    'Logo do projeto' | 'Tecnologia' | 'Ideia'
  >('Logo do projeto');
  const [width, setWidth] = useState(200);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState(false);
  const resize = useRef<{ x: number; width: number } | null>(null);
  const imageBox = useRef<HTMLDivElement>(null);
  const instructions = {
    link: 'Escolha Inserir > Link. Informe o texto e uma URL http:// ou https://. O link será inserido no cursor indicado.',
    table:
      'Abra Inserir > Tabela e selecione 3 × 3 na grade. A tabela será inserida no cursor indicado.',
    cell: 'Digite um texto na primeira célula da tabela.',
    image: 'Abra Inserir > Imagem e escolha uma imagem da galeria.',
    resize:
      'Arraste a alça da imagem para mudar seu tamanho. Pelo teclado, use as setas na alça.',
    done: 'Os elementos foram inseridos e a imagem foi redimensionada.',
  };
  function cancel() {
    setDialog(null);
    setError(false);
    setFeedback('');
  }
  function resizeTo(next: number) {
    const parent = imageBox.current?.parentElement;
    const padding = parent ? getComputedStyle(parent) : null;
    const max =
      parent && padding
        ? parent.clientWidth -
          parseFloat(padding.paddingLeft) -
          parseFloat(padding.paddingRight)
        : 300;
    const value = Math.max(80, Math.min(max, next));
    if (value !== imageBox.current?.getBoundingClientRect().width) {
      setWidth(value);
      if (!resize.current) {
        setStep('done');
        setFeedback('Imagem redimensionada.');
      }
    }
  }
  return (
    <DocsLesson
      instruction={instructions[step]}
      feedback={dialog ? undefined : feedback}
      error={error}
      result={
        step === 'done'
          ? 'Você inseriu um link, uma tabela e uma imagem e ajustou seu tamanho.'
          : undefined
      }
      onComplete={onComplete}
    >
      <DocsEditor
        highlight="Inserir"
        onMenu={{ Inserir: () => setMenu(!menu) }}
        menu={
          menu && (
            <>
              {(['link', 'table', 'image'] as const).map((item) => (
                <button
                  key={item}
                  disabled={step !== item}
                  data-guided={step === item}
                  onClick={() => {
                    setDialog(
                      item === 'link'
                        ? 'link'
                        : item === 'table'
                          ? 'grid'
                          : 'gallery',
                    );
                    setError(false);
                    setFeedback('');
                  }}
                >
                  {item === 'link'
                    ? 'Link'
                    : item === 'table'
                      ? 'Tabela'
                      : 'Imagem'}
                </button>
              ))}
            </>
          )
        }
      >
        <h3>Projeto Technovation</h3>
        <p>
          Este projeto organiza as ideias da equipe e a solução para a
          comunidade.
        </p>
        {step === 'link' && (
          <p
            className="docs-insertion-point"
            role="img"
            aria-label="Ponto de inserção do link"
          >
            │
          </p>
        )}
        {step !== 'link' && (
          <p>
            <a href={link.url} onClick={(event) => event.preventDefault()}>
              {link.text}
            </a>
          </p>
        )}
        {step === 'table' && (
          <p
            className="docs-insertion-point"
            role="img"
            aria-label="Ponto de inserção da tabela"
          >
            │
          </p>
        )}
        {['cell', 'image', 'resize', 'done'].includes(step) && (
          <table aria-label="Tabela inserida">
            <tbody>
              {Array.from({ length: 3 }, (_, row) => (
                <tr key={row}>
                  {Array.from({ length: 3 }, (_, col) => (
                    <td key={col}>
                      {row === 0 && col === 0 ? (
                        <input
                          aria-label="Primeira célula"
                          data-guided={step === 'cell'}
                          value={cell}
                          onChange={(event) => {
                            setCell(event.target.value);
                            if (step === 'cell' && event.target.value.trim()) {
                              setStep('image');
                              setFeedback(
                                'Texto inserido na tabela. Agora insira uma imagem.',
                              );
                            }
                          }}
                        />
                      ) : (
                        ''
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {['resize', 'done'].includes(step) && (
          <div className="docs-image" ref={imageBox} style={{ width }}>
            <div role="img" aria-label={`Imagem inserida: ${image}`}>
              {image === 'Logo do projeto' ? (
                <img src={logo} alt="" />
              ) : (
                <span className="docs-symbol">
                  {image === 'Tecnologia' ? '⌘' : '✦'}
                </span>
              )}
            </div>
            <button
              className="docs-resize"
              aria-label="Redimensionar imagem"
              onPointerDown={(event) => {
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                resize.current = {
                  x: event.clientX,
                  width:
                    imageBox.current?.getBoundingClientRect().width ?? width,
                };
              }}
              onPointerMove={(event) => {
                if (resize.current)
                  resizeTo(
                    resize.current.width + event.clientX - resize.current.x,
                  );
              }}
              onPointerUp={() => {
                if (
                  resize.current &&
                  imageBox.current?.getBoundingClientRect().width !==
                    resize.current.width
                ) {
                  setStep('done');
                  setFeedback('Imagem redimensionada.');
                }
                resize.current = null;
              }}
              onPointerCancel={() => {
                resize.current = null;
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  resizeTo(
                    (imageBox.current?.getBoundingClientRect().width ?? width) +
                      (event.key === 'ArrowRight' ? 10 : -10),
                  );
                }
              }}
            >
              ↔
            </button>
          </div>
        )}
        {dialog && (
          <DocsDialog
            title={
              dialog === 'link'
                ? 'Inserir link'
                : dialog === 'grid'
                  ? 'Escolher tamanho da tabela'
                  : 'Galeria de imagens'
            }
            onCancel={cancel}
          >
            {dialog === 'link' ? (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  let valid: boolean;
                  try {
                    const url = new URL(link.url);
                    valid =
                      ['http:', 'https:'].includes(url.protocol) &&
                      !!url.hostname;
                  } catch {
                    valid = false;
                  }
                  if (!valid) {
                    setError(true);
                    setFeedback(
                      'Use uma URL válida iniciada por http:// ou https://.',
                    );
                    return;
                  }
                  setLink({ text: link.text.trim(), url: link.url.trim() });
                  setDialog(null);
                  setStep('table');
                  setFeedback('Link inserido.');
                  setError(false);
                }}
              >
                <label>
                  Texto
                  <input
                    value={link.text}
                    onChange={(event) =>
                      setLink({ ...link, text: event.target.value })
                    }
                  />
                </label>
                <label>
                  Link
                  <input
                    value={link.url}
                    aria-invalid={error}
                    aria-describedby={error ? 'link-error' : undefined}
                    onChange={(event) => {
                      setLink({ ...link, url: event.target.value });
                      setError(false);
                    }}
                  />
                </label>
                {error && (
                  <p id="link-error" role="alert">
                    Use uma URL válida iniciada por http:// ou https://.
                  </p>
                )}
                <div className="program-actions">
                  <button type="button" onClick={cancel}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!link.text.trim() || !link.url.trim()}
                  >
                    Aplicar
                  </button>
                </div>
              </form>
            ) : dialog === 'grid' ? (
              <>
                <p aria-live="polite">
                  {grid.rows} × {grid.cols}
                </p>
                {feedback && <p role="status">{feedback}</p>}
                <div
                  className="docs-table-grid"
                  role="group"
                  aria-label="Dimensões da tabela"
                >
                  {Array.from({ length: 25 }, (_, index) => {
                    const rows = Math.floor(index / 5) + 1;
                    const cols = (index % 5) + 1;
                    return (
                      <button
                        key={index}
                        aria-label={`Tabela ${rows} por ${cols}`}
                        aria-pressed={rows <= grid.rows && cols <= grid.cols}
                        onPointerEnter={() => setGrid({ rows, cols })}
                        onFocus={() => setGrid({ rows, cols })}
                        onClick={() => {
                          if (rows !== 3 || cols !== 3) {
                            setFeedback(
                              'Para esta atividade, selecione uma tabela 3 × 3.',
                            );
                            return;
                          }
                          setDialog(null);
                          setStep('cell');
                          setMenu(false);
                          setFeedback(
                            'Tabela inserida. Digite na primeira célula.',
                          );
                        }}
                      >
                        □
                      </button>
                    );
                  })}
                </div>
                <button onClick={cancel}>Cancelar</button>
              </>
            ) : (
              <>
                <div className="docs-gallery">
                  {(['Logo do projeto', 'Tecnologia', 'Ideia'] as const).map(
                    (name) => (
                      <button
                        key={name}
                        onClick={() => {
                          setImage(name);
                          setStep('resize');
                          setDialog(null);
                          setMenu(false);
                          setFeedback(
                            'Imagem inserida. Agora ajuste o tamanho.',
                          );
                        }}
                      >
                        {name === 'Logo do projeto' ? (
                          <img src={logo} alt="" />
                        ) : (
                          <span aria-hidden="true">
                            {name === 'Tecnologia' ? '⌘' : '✦'}
                          </span>
                        )}
                        {name}
                      </button>
                    ),
                  )}
                </div>
                <button onClick={cancel}>Cancelar</button>
              </>
            )}
          </DocsDialog>
        )}
      </DocsEditor>
    </DocsLesson>
  );
}
