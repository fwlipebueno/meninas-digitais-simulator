import { useEffect, useRef } from 'react';
import './module-completion.css';

type ModuleCompletionItem = { title: string; subtitle: string };

export function ModuleCompletion({
  eyebrow,
  moduleName,
  items,
  onRepeat,
  onBack,
}: {
  eyebrow: string;
  moduleName: string;
  items: ModuleCompletionItem[];
  onRepeat: () => void;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <section
      className="completion module-completion"
      aria-labelledby="module-completion-title"
    >
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="module-completion-title" ref={heading} tabIndex={-1}>
        Módulo concluído!
      </h1>
      <p className="lead">
        Você concluiu todas as atividades de {moduleName}. Pode repetir o módulo
        para praticar de novo ou voltar para escolher outro assunto.
      </p>
      <p className="module-progress">
        <span className="module-progress-value">
          {items.length} de {items.length}
        </span>{' '}
        atividades concluídas
      </p>
      <div
        className="module-progress-bar"
        role="progressbar"
        aria-valuenow={items.length}
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-label={`Progresso do módulo ${moduleName}`}
      >
        <span></span>
      </div>
      <ul className="module-checklist">
        {items.map((item) => (
          <li key={item.title}>
            <span className="check" aria-hidden="true">
              ✓
            </span>
            <span>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="program-actions module-actions">
        <button className="primary" type="button" onClick={onRepeat}>
          Repetir módulo
        </button>
        <button type="button" onClick={onBack}>
          Voltar ao início
        </button>
      </div>
    </section>
  );
}
