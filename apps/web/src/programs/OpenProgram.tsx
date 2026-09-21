import { useState, type Ref } from 'react';
import { programs, type ProgramId } from './windows';

export function OpenProgram({
  start,
  onOpen,
  onDismiss,
  onFeedback,
  inputRef,
}: {
  start: boolean;
  onOpen: (id: ProgramId) => void;
  onDismiss: () => void;
  onFeedback: (message: string) => void;
  inputRef: Ref<HTMLInputElement>;
}) {
  const [query, setQuery] = useState('');
  const prefix = query.trim().toLocaleLowerCase('pt-BR');
  const results = (Object.keys(programs) as ProgramId[]).filter((id) =>
    programs[id].name.toLocaleLowerCase('pt-BR').startsWith(prefix),
  );
  return (
    <section
      className="start-menu"
      aria-label={start ? 'Menu Iniciar' : 'Pesquisa de programas'}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDismiss();
      }}
    >
      <div className="panel-heading">
        <h2>{start ? 'Menu Iniciar' : 'Pesquisa de programas'}</h2>
        <button onClick={onDismiss} aria-label="Fechar pesquisa">
          ×
        </button>
      </div>
      <label htmlFor="program-search">Pesquisar aplicativos</label>
      <input
        id="program-search"
        ref={inputRef}
        autoFocus
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && prefix && results[0]) onOpen(results[0]);
        }}
      />
      <p className="search-summary" role="status">
        {prefix
          ? `${results.length} resultado(s)`
          : 'Digite o nome do programa.'}
      </p>
      {prefix && (
        <ul className="search-results">
          {results.map((id, index) => (
            <li key={id}>
              <button
                className={index === 0 ? 'best-match' : ''}
                onClick={() => onOpen(id)}
              >
                <span className="program-icon" aria-hidden="true">
                  {programs[id].icon}
                </span>
                <span>
                  {programs[id].name}
                  {index === 0 && (
                    <small>Melhor correspondência · Enter para abrir</small>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {prefix && results.length === 0 && (
        <p>Nenhum programa encontrado. Tente “Bloco”.</p>
      )}
      {start && (
        <>
          <h3>Recomendados</h3>
          <div className="program-actions">
            {['Configurações', 'Calculadora'].map((name) => (
              <button
                key={name}
                onClick={() =>
                  onFeedback(
                    `${name} não faz parte desta atividade. Procure o Bloco de Notas.`,
                  )
                }
              >
                {name}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
