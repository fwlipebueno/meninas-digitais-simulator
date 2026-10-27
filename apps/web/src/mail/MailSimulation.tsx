import { useEffect, useRef, useState } from 'react';
import type { MailActivity } from './Mail';

type Message = { to: string; subject: string; body: string };
type Feedback = { kind: 'error' | 'success' | 'info'; text: string } | null;

export function MailSimulation({
  activity,
  accounts,
  onCreateAccount,
  onActivityChange,
  onComplete,
}: {
  activity: MailActivity;
  accounts: ReadonlyMap<string, string>;
  onCreateAccount: (email: string, password: string) => void;
  onActivityChange: (activity: MailActivity) => void;
  onComplete: (result: string) => void;
}) {
  const [view, setView] = useState<'login' | 'register' | { email: string }>(
    activity === 'send-mail' ? { email: 'aluna@treino.com' } : 'login',
  );
  const [registration, setRegistration] = useState({
    name: '',
    surname: '',
    username: '',
    password: '',
    confirm: '',
  });
  const [login, setLogin] = useState({ email: '', password: '' });
  const [folder, setFolder] = useState<'inbox' | 'sent' | 'drafts'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [composer, setComposer] = useState<
    (Message & { minimized: boolean }) | null
  >(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [result, setResult] = useState<string | null>(null);
  const inboxHeading = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const recipient = useRef<HTMLInputElement>(null);
  const writeButton = useRef<HTMLButtonElement>(null);
  const signedIn = typeof view === 'object';
  const composing = composer !== null && !composer.minimized;
  const username = registration.username.trim().toLowerCase();
  const unavailable =
    ['admin', 'meninasdigitais', 'technovation'].includes(username) ||
    accounts.has(`${username}@gmail.com`);
  let suggestion = `${username}.cp`;
  while (accounts.has(`${suggestion}@gmail.com`)) suggestion += '1';
  const strongPassword =
    registration.password.length >= 8 &&
    /[A-Za-z]/.test(registration.password) &&
    /\d/.test(registration.password);
  const invalidRecipient =
    composer !== null && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(composer.to.trim());
  const welcome = feedback?.text === 'Conta de treino criada. Bem-vinda!';

  useEffect(() => {
    if (signedIn && activity !== 'send-mail') inboxHeading.current?.focus();
  }, [signedIn, activity]);
  useEffect(() => {
    if (view === 'register') nameInput.current?.focus();
  }, [view]);
  useEffect(() => {
    if (composing) recipient.current?.focus();
  }, [composing]);
  useEffect(() => {
    if (!welcome) return;
    const timer = window.setTimeout(() => {
      if (document.activeElement?.closest('#mail-feedback'))
        inboxHeading.current?.focus();
      setFeedback(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [welcome]);

  function createAccount() {
    if (!Object.values(registration).every((value) => value.trim())) {
      setFeedback({ kind: 'error', text: 'Preencha todos os campos.' });
    } else if (unavailable) {
      setFeedback({
        kind: 'error',
        text: 'Escolha um nome de usuário disponível.',
      });
    } else if (!strongPassword) {
      setFeedback({
        kind: 'error',
        text: 'Use pelo menos 8 caracteres, com letras e números.',
      });
    } else if (registration.password !== registration.confirm) {
      setFeedback({ kind: 'error', text: 'As senhas não conferem.' });
    } else {
      const email = `${username}@gmail.com`;
      onCreateAccount(email, registration.password);
      setView({ email });
      setFeedback({
        kind: 'success',
        text: 'Conta de treino criada. Bem-vinda!',
      });
      setResult(
        'A conta de treino foi criada e a caixa de entrada foi aberta.',
      );
    }
  }
  function signIn() {
    if (activity !== 'login-mail') onActivityChange('login-mail');
    const email = login.email.trim().toLowerCase();
    if (!accounts.has(email) || accounts.get(email) !== login.password) {
      setFeedback({
        kind: 'error',
        text: 'E-mail ou senha incorretos. Tente novamente.',
      });
      return;
    }
    setView({ email });
    setFeedback({ kind: 'success', text: 'Você entrou na conta de treino.' });
    setResult('Você entrou na conta de treino e abriu a caixa de entrada.');
  }
  function discard() {
    setComposer(null);
    setFeedback({
      kind: 'info',
      text: 'Mensagem descartada. Nenhum e-mail foi enviado.',
    });
    writeButton.current?.focus();
  }
  function send() {
    if (!composer) return;
    if (invalidRecipient) {
      setFeedback({
        kind: 'error',
        text: 'Digite um endereço de e-mail válido.',
      });
      recipient.current?.focus();
    } else if (!composer.subject.trim() || !composer.body.trim()) {
      setFeedback({ kind: 'error', text: 'Preencha o assunto e a mensagem.' });
    } else {
      setMessages((prev) => [
        ...prev,
        {
          to: composer.to.trim(),
          subject: composer.subject.trim(),
          body: composer.body.trim(),
        },
      ]);
      setComposer(null);
      setFolder('sent');
      setFeedback({ kind: 'success', text: 'Mensagem enviada.' });
      if (activity === 'send-mail')
        setResult('A mensagem foi enviada e registrada em Enviados.');
      inboxHeading.current?.focus();
    }
  }

  return (
    <div className="scenario-grid mail-scenario">
      <aside className="instructions" aria-label="Instruções da atividade">
        <p className="eyebrow">{result ? 'Objetivo alcançado' : 'Sua vez'}</p>
        <h2>
          {activity === 'create-account'
            ? 'Crie uma conta de treino'
            : activity === 'login-mail'
              ? 'Entre na conta de treino'
              : 'Envie uma mensagem'}
        </h2>
        <p>
          {result ??
            (activity === 'create-account'
              ? 'Clique em Criar conta e preencha o formulário com dados fictícios.'
              : activity === 'login-mail'
                ? 'Use aluna@treino.com e a senha treino123.'
                : 'Clique em Escrever. Preencha Para, Assunto e Corpo e clique em Enviar.')}
        </p>
        <details>
          <summary>Mostrar dica</summary>
          <p>
            {activity === 'create-account'
              ? 'Escolha um usuário disponível e uma senha com pelo menos 8 caracteres, incluindo letras e números.'
              : activity === 'login-mail'
                ? 'A senha permanece mascarada. Você também pode usar uma conta criada neste treino.'
                : 'Use mentora@exemplo.com como destinatário. X e Descartar apagam somente a mensagem em composição.'}
          </p>
        </details>
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
      <section className="mail-simulator" aria-label="Simulação de E-mail">
        <p className="mail-brand">
          <span aria-hidden="true">@</span> Gmail — simulação
        </p>
        {!signedIn ? (
          <div className="mail-card">
            <h2>{view === 'register' ? 'Criar conta' : 'Entrar'}</h2>
            <p>Use dados fictícios. Nenhuma conta real é acessada ou criada.</p>
            {view === 'register' ? (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  createAccount();
                }}
              >
                {(
                  [
                    ['name', 'Nome'],
                    ['surname', 'Sobrenome'],
                    ['username', 'Nome de usuário'],
                    ['password', 'Senha'],
                    ['confirm', 'Confirmar senha'],
                  ] as const
                ).map(([field, label]) => (
                  <div className="mail-field" key={field}>
                    <label htmlFor={`mail-${field}`}>{label}</label>
                    <input
                      id={`mail-${field}`}
                      ref={field === 'name' ? nameInput : undefined}
                      type={
                        field === 'password' || field === 'confirm'
                          ? 'password'
                          : 'text'
                      }
                      required
                      autoComplete="off"
                      value={registration[field]}
                      aria-describedby={
                        field === 'username'
                          ? 'username-status'
                          : field === 'password'
                            ? 'password-status'
                            : undefined
                      }
                      onChange={(event) => {
                        setRegistration({
                          ...registration,
                          [field]: event.target.value,
                        });
                        setFeedback(null);
                      }}
                    />
                    {field === 'username' && (
                      <>
                        <span className="mail-hint">@gmail.com</span>
                        <p id="username-status" role="status">
                          {username
                            ? unavailable
                              ? `Nome de usuário indisponível. Tente ${suggestion}.`
                              : 'Nome de usuário disponível.'
                            : ''}
                        </p>
                      </>
                    )}
                    {field === 'password' && (
                      <p id="password-status" role="status">
                        {strongPassword
                          ? 'Senha válida.'
                          : 'Use pelo menos 8 caracteres, com letras e números.'}
                      </p>
                    )}
                  </div>
                ))}
                <button className="primary" type="submit">
                  Criar conta de treino
                </button>
              </form>
            ) : (
              <form
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  signIn();
                }}
              >
                <div className="mail-field">
                  <label htmlFor="mail-email">E-mail ou telefone</label>
                  <input
                    id="mail-email"
                    autoComplete="off"
                    value={login.email}
                    onChange={(event) => {
                      setLogin({ ...login, email: event.target.value });
                      setFeedback(null);
                    }}
                  />
                </div>
                <div className="mail-field">
                  <label htmlFor="mail-login-password">Senha</label>
                  <input
                    id="mail-login-password"
                    type="password"
                    autoComplete="off"
                    value={login.password}
                    onChange={(event) => {
                      setLogin({ ...login, password: event.target.value });
                      setFeedback(null);
                    }}
                  />
                </div>
                <div className="program-actions">
                  <button
                    type="button"
                    onClick={() => {
                      if (activity !== 'create-account')
                        onActivityChange('create-account');
                      setView('register');
                      setFeedback(null);
                    }}
                  >
                    Criar conta
                  </button>
                  <button className="primary" type="submit">
                    Entrar
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            <p className="mail-account">{view.email}</p>
            <div className="mail-app">
              <nav aria-label="Pastas de e-mail">
                <button
                  ref={writeButton}
                  className="primary"
                  onClick={() => {
                    if (composer)
                      setComposer({ ...composer, minimized: false });
                    else
                      setComposer({
                        to: '',
                        subject: '',
                        body: '',
                        minimized: false,
                      });
                    setFeedback(null);
                  }}
                >
                  Escrever
                </button>
                {(
                  [
                    ['inbox', 'Caixa de entrada'],
                    ['sent', 'Enviados'],
                    ['drafts', 'Rascunhos'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    aria-current={folder === id ? 'page' : undefined}
                    onClick={() => setFolder(id)}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <section
                className="mail-folder"
                aria-labelledby="mail-folder-title"
              >
                <h2 id="mail-folder-title" ref={inboxHeading} tabIndex={-1}>
                  {folder === 'inbox'
                    ? 'Caixa de entrada'
                    : folder === 'sent'
                      ? 'Enviados'
                      : 'Rascunhos'}
                </h2>
                {folder === 'inbox' ? (
                  <ul>
                    <li>
                      Equipe Meninas Digitais — Bem-vinda à atividade de treino
                    </li>
                    <li>Technovation Girls — Materiais para o encontro</li>
                  </ul>
                ) : folder === 'drafts' ? (
                  <p>Nenhum rascunho salvo nesta atividade.</p>
                ) : messages.length ? (
                  <ul>
                    {messages.map((message, index) => (
                      <li key={index}>
                        <strong>Para: {message.to}</strong>
                        <p>{message.subject}</p>
                        <p className="mail-message-body">{message.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhuma mensagem enviada.</p>
                )}
              </section>
            </div>
            {composer && (
              <section className="mail-compose" aria-label="Nova mensagem">
                <div className="mail-compose-title">
                  <h2>Nova mensagem</h2>
                  <button
                    aria-label={
                      composer.minimized
                        ? 'Restaurar mensagem'
                        : 'Minimizar mensagem'
                    }
                    aria-expanded={!composer.minimized}
                    onClick={() =>
                      setComposer({
                        ...composer,
                        minimized: !composer.minimized,
                      })
                    }
                  >
                    {composer.minimized ? '□' : '—'}
                  </button>
                  <button
                    aria-label="Fechar e descartar mensagem"
                    onClick={discard}
                  >
                    ×
                  </button>
                </div>
                {!composer.minimized && (
                  <form
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      send();
                    }}
                  >
                    <div className="mail-field">
                      <label htmlFor="mail-to">Para</label>
                      <input
                        id="mail-to"
                        ref={recipient}
                        type="email"
                        required
                        aria-invalid={
                          feedback?.kind === 'error' && invalidRecipient
                        }
                        aria-describedby={
                          feedback?.kind === 'error' && invalidRecipient
                            ? 'mail-feedback'
                            : undefined
                        }
                        value={composer.to}
                        onChange={(event) => {
                          setComposer({ ...composer, to: event.target.value });
                          setFeedback(null);
                        }}
                      />
                    </div>
                    <div className="mail-field">
                      <label htmlFor="mail-subject">Assunto</label>
                      <input
                        id="mail-subject"
                        required
                        value={composer.subject}
                        onChange={(event) => {
                          setComposer({
                            ...composer,
                            subject: event.target.value,
                          });
                          setFeedback(null);
                        }}
                      />
                    </div>
                    <div className="mail-field">
                      <label htmlFor="mail-body">Corpo</label>
                      <textarea
                        id="mail-body"
                        required
                        value={composer.body}
                        onChange={(event) => {
                          setComposer({
                            ...composer,
                            body: event.target.value,
                          });
                          setFeedback(null);
                        }}
                      />
                    </div>
                    <div className="program-actions">
                      <button className="primary" type="submit">
                        Enviar
                      </button>
                      <button type="button" onClick={discard}>
                        Descartar
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}
          </>
        )}
        {feedback && (
          <div
            id="mail-feedback"
            className={`mail-feedback ${feedback.kind}`}
            role={feedback.kind === 'error' ? 'alert' : 'status'}
          >
            <span>{feedback.text}</span>
            {welcome && (
              <button
                aria-label="Fechar mensagem de boas-vindas"
                onClick={() => {
                  setFeedback(null);
                  inboxHeading.current?.focus();
                }}
              >
                ×
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
