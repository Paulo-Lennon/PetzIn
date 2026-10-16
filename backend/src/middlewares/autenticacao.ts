import { NextFunction, Request, Response } from 'express';
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { obterConfiguracaoJwt } from '../config/autenticacao';

declare global {
  namespace Express {
    interface Request {
      usuarioId?: string;
    }
  }
}

function responderNaoAutorizado(res: Response): void {
  res.status(401).json({
    mensagem: 'Token inválido ou expirado',
  });
}

// Valida o token Bearer e disponibiliza o usuário autenticado na requisição.
export function autenticarToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cabecalhoAutorizacao = req.headers.authorization;

  if (!cabecalhoAutorizacao) {
    responderNaoAutorizado(res);
    return;
  }

  const [esquema, token, parteExtra] = cabecalhoAutorizacao.split(' ');

  if (esquema?.toLowerCase() !== 'bearer' || !token || parteExtra) {
    responderNaoAutorizado(res);
    return;
  }

  let segredo: string;

  try {
    segredo = obterConfiguracaoJwt().segredo;
  } catch (error) {
    next(error);
    return;
  }

  try {
    const conteudo = jwt.verify(token, segredo, {
      algorithms: ['HS256'],
    });

    if (typeof conteudo === 'string' || typeof conteudo.sub !== 'string') {
      responderNaoAutorizado(res);
      return;
    }

    req.usuarioId = conteudo.sub;
    next();
  } catch (error) {
    if (
      error instanceof JsonWebTokenError ||
      error instanceof TokenExpiredError
    ) {
      responderNaoAutorizado(res);
      return;
    }

    next(error);
  }
}
