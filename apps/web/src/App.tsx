import { useState } from 'react';
import logo from './assets/meninas-digitais.png';
import { Programs } from './programs/Programs';
import { Files } from './files/Files';
import { Mail } from './mail/Mail';

const modules = [
  {
    id: 'programs',
    name: 'Programas',
    environment: 'Windows',
    description: 'Abrir, fechar e alternar entre programas e janelas.',
  },
  {
    id: 'files',
    name: 'Arquivos',
    environment: 'Bloco de Notas',
    description: 'Criar, salvar, renomear e excluir arquivos.',
  },
  {
    id: 'email',
    name: 'E-mail',
    environment: 'Gmail',
    description:
      'Criar uma conta, entrar, escrever e enviar mensagens em uma simulação.',
  },
  {
    id: 'docs',
    name: 'Google Docs',
    environment: 'Editor de texto',
    description:
      'Conhecer a interface, formatar textos e praticar recursos de edição e colaboração.',
  },
] as const;

export function App() {
  const [module, setModule] = useState<'programs' | 'files' | 'email' | null>(
    null,
  );
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
        {module === 'programs' ? (
          <Programs onBack={() => setModule(null)} />
        ) : module === 'files' ? (
          <Files onBack={() => setModule(null)} />
        ) : module === 'email' ? (
          <Mail onBack={() => setModule(null)} />
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
                <span className="status">
                  Programas, Arquivos e E-mail disponíveis
                </span>
              </div>
              <p className="availability">
                Pratique em Programas, Arquivos e E-mail. Google Docs está em
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
                        {module.id !== 'docs' ? (
                          <button
                            className="module-link"
                            onClick={() => setModule(module.id)}
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
