export const programs = {
  notepad: {
    name: 'Bloco de Notas',
    icon: 'N',
    content: 'Anotações da atividade',
  },
  browser: {
    name: 'Navegador',
    icon: 'E',
    content: 'Página de pesquisa — janela simulada do navegador.',
  },
  files: {
    name: 'Arquivos',
    icon: 'A',
    content:
      'Janela simulada de Arquivos. Nesta atividade, pratique apenas abrir e fechar programas.',
  },
} as const;
export type ProgramId = keyof typeof programs;
export type OpenWindow = {
  id: ProgramId;
  maximized: boolean;
  minimized: boolean;
  status: 'running' | 'unresponsive';
};
