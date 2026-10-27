import { useEffect, useRef, useState } from 'react';
import { ModuleCompletion } from '../ModuleCompletion';
import {
  fetchCompletedActivityIds,
  getSessionId,
  recordCompletion,
} from '../api';
import { MailSimulation } from './MailSimulation';
import './mail.css';

const activities = {
  'create-account': {
    title: 'Criar uma conta',
    description: 'Cadastro e disponibilidade do nome de usuário',
  },
  'login-mail': {
    title: 'Fazer login',
    description: 'E-mail e senha da conta de treino',
  },
  'send-mail': {
    title: 'Enviar um e-mail',
    description: 'Escrever, enviar e descartar mensagens',
  },
} as const;
export type MailActivity = keyof typeof activities;

export function Mail({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<{
    activity: MailActivity;
    result?: string;
    summary?: boolean;
  } | null>(null);
  const [completed, setCompleted] = useState<ReadonlySet<MailActivity>>(
    () => new Set(),
  );
  const [accounts, setAccounts] = useState<ReadonlyMap<string, string>>(
    () => new Map([['aluna@treino.com', 'treino123']]),
  );
  const heading = useRef<HTMLHeadingElement>(null);
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
              ...(Object.keys(activities) as MailActivity[]).filter(
                (activity) => ids.includes(activity),
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
          eyebrow="✓ E-mail · Gmail"
          moduleName="E-mail"
          items={Object.values(activities).map((info) => ({
            title: info.title,
            subtitle: info.description,
          }))}
          onRepeat={() => setScreen(null)}
          onBack={onBack}
        />
      );
    return (
      <section className="completion">
        <p className="eyebrow">✓ E-mail</p>
        <h1 ref={heading} tabIndex={-1}>
          Atividade concluída
        </h1>
        <p>{screen.result}</p>
        <div className="program-actions">
          <button onClick={() => setScreen({ activity: screen.activity })}>
            Repetir atividade
          </button>
          <button onClick={() => setScreen(null)}>Voltar à seleção</button>
          {(Object.keys(activities) as MailActivity[]).every((activity) =>
            completed.has(activity),
          ) && (
            <button onClick={() => setScreen({ ...screen, summary: true })}>
              Ver resumo do módulo
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="mail-module">
      <nav aria-label="Navegação de E-mail">
        <button onClick={() => (screen ? setScreen(null) : onBack())}>
          {screen ? '← Voltar à seleção' : '← Início'}
        </button>
        {screen && <span>Ambiente simulado</span>}
      </nav>
      {!screen && <p className="eyebrow">E-mail · Gmail</p>}
      <h1 ref={heading} tabIndex={-1}>
        {screen
          ? activities[screen.activity].title
          : 'Criar conta, fazer login e enviar e-mails'}
      </h1>
      {screen ? (
        <MailSimulation
          activity={screen.activity}
          accounts={accounts}
          onActivityChange={(activity) => setScreen({ activity })}
          onCreateAccount={(email, password) =>
            setAccounts((prev) => new Map([...prev, [email, password]]))
          }
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
            Escolha uma atividade. Use dados fictícios: contas e mensagens
            existem somente durante o treino.
          </p>
          <div className="activity-list">
            {Object.entries(activities).map(([activity, info], index) => (
              <button
                key={activity}
                onClick={() =>
                  setScreen({ activity: activity as MailActivity })
                }
              >
                <span className="module-number">0{index + 1}</span>
                <span>
                  <strong>{info.title}</strong>
                  <span>{info.description}</span>
                  {completed.has(activity as MailActivity) && (
                    <span>✓ Concluída</span>
                  )}
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
