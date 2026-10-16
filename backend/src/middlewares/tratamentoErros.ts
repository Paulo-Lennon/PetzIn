import { ErrorRequestHandler } from 'express';

interface ErroParseJson extends SyntaxError {
  status?: number;
  type?: string;
}

// Garante respostas JSON também para erros ocorridos antes dos controllers.
export const tratarErros: ErrorRequestHandler = (error, _req, res, _next) => {
  const erroParseJson = error as ErroParseJson;

  if (
    error instanceof SyntaxError &&
    erroParseJson.status === 400 &&
    erroParseJson.type === 'entity.parse.failed'
  ) {
    res.status(400).json({
      mensagem: 'JSON inválido',
    });
    return;
  }

  console.error('Erro inesperado na API:', error);

  res.status(500).json({
    mensagem: 'Erro interno do servidor',
  });
};
