import { useEffect, useRef, useState } from 'react';
import { ModuleCompletion } from '../ModuleCompletion';
import {
  fetchCompletedActivityIds,
  getSessionId,
  recordCompletion,
} from '../api';
import { InterfaceActivity, ExportActivity } from './DocsSimulation';
import { InsertElements } from './InsertElements';
import { EditorTools } from './EditorTools';
import './docs.css';

const activities = {
  'docs-interface': {
    title: 'Conhecer a interface',
    description: 'Título, menus, régua e barra de ferramentas',
    component: InterfaceActivity,
  },
  'docs-insert-elements': {
    title: 'Inserir elementos',
    description: 'Link, tabela e imagem em um documento',
    component: InsertElements,
  },
  'docs-export': {
    title: 'Exportar um documento',
    description: 'Escolher um formato e simular o download',
    component: ExportActivity,
  },
  'docs-tools': {
    title: 'Usar ferramentas do editor',
    description: 'Zoom, busca, compartilhamento, revisão, estilos e sumário',
    component: EditorTools,
  },
} as const;
type Activity = keyof typeof activities;

export function Docs({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<{
    activity: Activity;
    result?: string;
    summary?: boolean;
  } | null>(null);
  const [completed, setCompleted] = useState<ReadonlySet<Activity>>(
    () => new Set(),
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [screen?.activity, screen?.result, screen?.summary]);
  useEffect(() => {
    let active = true;
    fetchCompletedActivityIds(getSessionId())
      .then((ids) => {
        if (active)
          setCompleted(
            (prev) =>
              new Set([
                ...prev,
                ...(Object.keys(activities) as Activity[]).filter((id) =>
                  ids.includes(id),
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
  if (screen?.result) {
    if (screen.summary)
      return (
        <ModuleCompletion
          eyebrow="✓ Google Docs"
          moduleName="Google Docs"
          items={Object.values(activities).map(({ title, description }) => ({
            title,
            subtitle: description,
          }))}
          onRepeat={() => setScreen(null)}
          onBack={onBack}
        />
      );
    return (
      <section className="completion">
        <p className="eyebrow">✓ Google Docs</p>
        <h1 ref={heading} tabIndex={-1}>
          Atividade concluída
        </h1>
        <p>{screen.result}</p>
        <div className="program-actions">
          <button onClick={() => setScreen({ activity: screen.activity })}>
            Repetir atividade
          </button>
          <button onClick={() => setScreen(null)}>Voltar à seleção</button>
          {(Object.keys(activities) as Activity[]).every((id) =>
            completed.has(id),
          ) && (
            <button onClick={() => setScreen({ ...screen, summary: true })}>
              Ver resumo do módulo
            </button>
          )}
        </div>
      </section>
    );
  }
  const Simulation = screen ? activities[screen.activity].component : null;
  return (
    <div className="docs-module">
      <nav aria-label="Navegação de Google Docs">
        <button onClick={() => (screen ? setScreen(null) : onBack())}>
          {screen ? '← Voltar à seleção' : '← Início'}
        </button>
        {screen && <span>Ambiente simulado</span>}
      </nav>
      {!screen && <p className="eyebrow">Google Docs · Editor de texto</p>}
      <h1 ref={heading} tabIndex={-1}>
        {screen
          ? activities[screen.activity].title
          : 'Conhecer e usar o Google Docs'}
      </h1>
      {screen && Simulation ? (
        <Simulation
          onComplete={(result) => {
            setCompleted((prev) => new Set([...prev, screen.activity]));
            recordCompletion(getSessionId(), screen.activity).catch(
              (error: unknown) =>
                console.warn('Conclusão não registrada:', error),
            );
            setScreen({ ...screen, result });
          }}
        />
      ) : (
        <>
          <p className="lead">
            Escolha uma atividade. O documento existe somente durante o treino.
          </p>
          <div className="activity-list">
            {Object.entries(activities).map(([id, info], index) => (
              <button
                key={id}
                onClick={() => setScreen({ activity: id as Activity })}
              >
                <span className="module-number">0{index + 1}</span>
                <span>
                  <strong>{info.title}</strong>
                  <span>{info.description}</span>
                  {completed.has(id as Activity) && <span>✓ Concluída</span>}
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
