import { useEffect, useRef, useState } from 'react';
import { FileSimulation } from './FileSimulation';
import './files.css';

const activities = {
  create: { title: 'Criar um documento', description: 'Arquivo > Novo' },
  save: {
    title: 'Salvar um arquivo',
    description: 'Salvar como · Salvar · Ctrl + S',
  },
  rename: {
    title: 'Renomear um arquivo',
    description: 'Menu de contexto > Renomear',
  },
  delete: {
    title: 'Excluir um arquivo',
    description: 'Menu de contexto > Excluir',
  },
} as const;
export type FileActivity = keyof typeof activities;

export function Files({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<{
    activity: FileActivity;
    result?: string;
  } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [screen?.activity, screen?.result]);

  return (
    <div className="files-module">
      {screen?.result ? (
        <section className="completion">
          <p className="eyebrow">✓ Arquivos</p>
          <h1 ref={heading} tabIndex={-1}>
            Atividade concluída
          </h1>
          <p>{screen.result}</p>
          <div className="program-actions">
            <button onClick={() => setScreen({ activity: screen.activity })}>
              Repetir atividade
            </button>
            <button onClick={() => setScreen(null)}>Voltar à seleção</button>
          </div>
        </section>
      ) : (
        <>
          <nav aria-label="Navegação de Arquivos">
            <button onClick={() => (screen ? setScreen(null) : onBack())}>
              {screen ? '← Voltar à seleção' : '← Início'}
            </button>
            {screen && <span>Ambiente simulado</span>}
          </nav>
          {!screen && <p className="eyebrow">Arquivos · Bloco de Notas</p>}
          <h1 ref={heading} tabIndex={-1}>
            {screen
              ? activities[screen.activity].title
              : 'Criar, salvar, renomear e excluir arquivos'}
          </h1>
          {screen ? (
            <FileSimulation
              key={screen.activity}
              activity={screen.activity}
              onComplete={(result) => setScreen({ ...screen, result })}
            />
          ) : (
            <>
              <p className="lead">
                Escolha uma atividade. Os arquivos existem somente durante o
                treino.
              </p>
              <div className="activity-list">
                {Object.entries(activities).map(([activity, info], index) => (
                  <button
                    key={activity}
                    onClick={() =>
                      setScreen({ activity: activity as FileActivity })
                    }
                  >
                    <span className="module-number">0{index + 1}</span>
                    <span>
                      <strong>{info.title}</strong>
                      <span>{info.description}</span>
                    </span>
                    <span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
