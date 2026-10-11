import { useEffect, useRef, useState } from 'react';
import { ModuleCompletion } from '../ModuleCompletion';
import {
  fetchCompletedActivityIds,
  getSessionId,
  recordCompletion,
} from '../api';
import { ProgramSimulation } from './ProgramSimulation';
import './programs.css';

const activities = {
  open: {
    title: 'Abrir um programa',
    methods: {
      start: 'Menu Iniciar',
      search: 'Win + S',
      desktop: 'Duplo clique',
    },
  },
  close: {
    title: 'Fechar um programa',
    methods: {
      close: 'Botão X',
      'alt-f4': 'Alt + F4',
      'task-manager': 'Gerenciador de Tarefas',
    },
  },
  switch: {
    title: 'Alternar programas',
    methods: { 'alt-tab': 'Alt + Tab', 'task-view': 'Win + Tab' },
  },
} as const;
export type Activity = keyof typeof activities;
export type Method = {
  [A in Activity]: keyof (typeof activities)[A]['methods'];
}[Activity];

type Screen = { activity: Activity; method: Method; result?: string } | null;

const activityIds = {
  open: 'open-program',
  close: 'close-program',
  switch: 'switch-program',
} as const satisfies Record<Activity, string>;

export function Programs({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<Screen>(null);
  const [completed, setCompleted] = useState<ReadonlySet<Activity>>(
    () => new Set(),
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [screen?.activity, screen?.result]);

  useEffect(() => {
    let active = true;
    fetchCompletedActivityIds(getSessionId())
      .then((ids) => {
        if (!active) return;
        setCompleted(
          (prev) =>
            new Set([
              ...prev,
              ...(Object.keys(activities) as Activity[]).filter((activity) =>
                ids.includes(activityIds[activity]),
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
    const allDone = (Object.keys(activities) as Activity[]).every((activity) =>
      completed.has(activity),
    );
    if (allDone)
      return (
        <ModuleCompletion
          eyebrow="✓ Programas · Windows"
          moduleName="Programas"
          items={(Object.keys(activities) as Activity[]).map((activity) => ({
            title: activities[activity].title,
            subtitle: Object.values(activities[activity].methods).join(' · '),
          }))}
          onRepeat={() => {
            setCompleted(new Set<Activity>());
            setScreen(null);
          }}
          onBack={onBack}
        />
      );
    return (
      <section className="completion">
        <p className="eyebrow">✓ Programas</p>
        <h1 ref={heading} tabIndex={-1}>
          Atividade concluída
        </h1>
        <p>{screen.result}</p>
        <div className="program-actions">
          <button
            onClick={() =>
              setScreen({ activity: screen.activity, method: screen.method })
            }
          >
            Repetir atividade
          </button>
          <button onClick={() => setScreen(null)}>Voltar à seleção</button>
        </div>
      </section>
    );
  }

  if (screen)
    return (
      <>
        <nav aria-label="Navegação de Programas">
          <button onClick={() => setScreen(null)}>← Voltar à seleção</button>
          <span>Ambiente simulado</span>
        </nav>
        <h1 ref={heading} tabIndex={-1}>
          {activities[screen.activity].title}
        </h1>
        <div
          className="method-picker"
          role="group"
          aria-label="Método desta atividade"
        >
          {Object.entries(activities[screen.activity].methods).map(
            ([method, label]) => (
              <button
                key={method}
                aria-pressed={screen.method === method}
                onClick={() =>
                  setScreen({
                    activity: screen.activity,
                    method: method as Method,
                  })
                }
              >
                {label}
              </button>
            ),
          )}
        </div>
        <ProgramSimulation
          key={`${screen.activity}-${screen.method}`}
          activity={screen.activity}
          method={screen.method}
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
      </>
    );

  return (
    <>
      <nav aria-label="Navegação de Programas">
        <button onClick={onBack}>← Início</button>
      </nav>
      <p className="eyebrow">Programas · Windows</p>
      <h1 ref={heading} tabIndex={-1}>
        Abrir, fechar e alternar entre programas
      </h1>
      <p className="lead">
        Escolha uma atividade. Você pode repetir cada método no seu ritmo.
      </p>
      <div className="activity-list">
        {Object.entries(activities).map(([activity, info], index) => (
          <button
            key={activity}
            onClick={() =>
              setScreen({
                activity: activity as Activity,
                method: Object.keys(info.methods)[0] as Method,
              })
            }
          >
            <span className="module-number">0{index + 1}</span>
            <span>
              <strong>{info.title}</strong>
              <span>{Object.values(info.methods).join(' · ')}</span>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </>
  );
}
