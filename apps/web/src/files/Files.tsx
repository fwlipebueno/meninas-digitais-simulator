import { useEffect, useRef, useState } from 'react';
import { ModuleCompletion } from '../ModuleCompletion';
import {
  fetchCompletedActivityIds,
  getSessionId,
  recordCompletion,
} from '../api';
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

const activityIds = {
  create: 'new-file',
  save: 'save-file',
  rename: 'rename-file',
  delete: 'delete-file',
} as const satisfies Record<FileActivity, string>;

export function Files({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<{
    activity: FileActivity;
    result?: string;
    summary?: boolean;
  } | null>(null);
  const [completed, setCompleted] = useState<ReadonlySet<FileActivity>>(
    () => new Set(),
  );
  const heading = useRef<HTMLHeadingElement>(null);
  const activityRoot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [screen?.activity, screen?.result, screen?.summary]);

  useEffect(() => {
    let active = true;
    fetchCompletedActivityIds(getSessionId())
      .then((ids) => {
        if (!active) return;
        setCompleted(
          (prev) =>
            new Set([
              ...prev,
              ...(Object.keys(activities) as FileActivity[]).filter(
                (activity) => ids.includes(activityIds[activity]),
              ),
            ]),
        );
      })
      .catch((error: unknown) =>
        console.warn('Progresso anterior não carregado:', error),
      );
    return () => {
      active = false;
    };
  }, []);

  return (
    <div ref={activityRoot} className="files-module">
      {screen?.result ? (
        screen.summary ? (
          <ModuleCompletion
            eyebrow="✓ Arquivos · Bloco de Notas"
            moduleName="Arquivos"
            items={(Object.keys(activities) as FileActivity[]).map(
              (activity) => ({
                title: activities[activity].title,
                subtitle: activities[activity].description,
              }),
            )}
            onRepeat={() => setScreen(null)}
            onBack={onBack}
          />
        ) : (
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
              {(Object.keys(activities) as FileActivity[]).every((activity) =>
                completed.has(activity),
              ) && (
                <button onClick={() => setScreen({ ...screen, summary: true })}>
                  Ver resumo do módulo
                </button>
              )}
            </div>
          </section>
        )
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
              activityRoot={activityRoot}
              onComplete={(result) => {
                setCompleted((prev) => {
                  const next = new Set(prev);
                  next.add(screen.activity);
                  return next;
                });
                recordCompletion(
                  getSessionId(),
                  activityIds[screen.activity],
                ).catch((error: unknown) =>
                  console.warn('Conclusão não registrada:', error),
                );
                setScreen({ ...screen, result });
              }}
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
                      {completed.has(activity as FileActivity) && (
                        <span>✓ Concluída</span>
                      )}
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
