import { useState } from 'react';
import logo from './assets/meninas-digitais.png';
import { Programs } from './programs/Programs';

const modules = [
  {
    name: 'Programas',
    environment: 'Windows',
    description: 'Abrir, fechar e alternar entre programas e janelas.',
  },
  {
    name: 'Arquivos',
    environment: 'Bloco de Notas',
    description: 'Criar, salvar, renomear e excluir arquivos.',
  },
  {
    name: 'E-mail',
    environment: 'Gmail',
    description:
      'Criar uma conta, entrar, escrever e enviar mensagens em uma simulação.',
  },
  {
    name: 'Google Docs',
    environment: 'Editor de texto',
    description:
      'Conhecer a interface, formatar textos e praticar recursos de edição e colaboração.',
  },
];

export function App() {
  const [programs, setPrograms] = useState(false);
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="topbar">
        <img
          src={logo}
          alt="Meninas Digitais UTFPR-CP"
          width="116"
          height="60"
        />
        <span>Simulador de informática básica</span>
      </header>
      <main id="conteudo" tabIndex={-1}>
        {programs ? (
          <Programs onBack={() => setPrograms(false)} />
        ) : (
          <>
            <div className="intro">
              <div>
                <p className="eyebrow">Informática básica</p>
                <h1>Aprender na prática</h1>
                <p className="lead">
                  Conheça os módulos para praticar tarefas comuns do computador
                  em um ambiente simulado.
                </p>
              </div>
              <p className="context">
                <strong>Preparação para a Technovation Girls</strong>
                <br />
                Aprendizado no seu ritmo, com instruções e feedback a cada
                atividade.
              </p>
            </div>
            <section aria-labelledby="modules-title">
              <div className="section-heading">
                <h2 id="modules-title">Módulos de aprendizagem</h2>
                <span className="status">Programas disponível</span>
              </div>
              <p className="availability">
                Pratique em Programas. Os demais módulos estão em
                desenvolvimento.
              </p>
              <ul className="modules">
                {modules.map((module, index) => (
                  <li key={module.name}>
                    <span className="module-number" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <div>
                      <h3>
                        {index === 0 ? (
                          <button
                            className="module-link"
                            onClick={() => setPrograms(true)}
                          >
                            {module.name} <span aria-hidden="true">→</span>
                          </button>
                        ) : (
                          module.name
                        )}
                      </h3>
                      <p>{module.description}</p>
                    </div>
                    <span className="environment">{module.environment}</span>
                  </li>
                ))}
              </ul>
            </section>
            <p className="simulation-note">
              Um espaço de treino: as atividades são simuladas, sem alterar
              arquivos, contas ou serviços reais.
            </p>
          </>
        )}
      </main>
    </>
  );
}
