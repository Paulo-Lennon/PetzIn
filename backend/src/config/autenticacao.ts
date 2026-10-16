import { SignOptions } from 'jsonwebtoken';

interface ConfiguracaoJwt {
  segredo: string;
  expiracao: SignOptions['expiresIn'];
}

// Centraliza e valida as configurações usadas para gerar tokens de acesso.
export function obterConfiguracaoJwt(): ConfiguracaoJwt {
  const segredo = process.env.JWT_SECRET;
  const expiracao = process.env.JWT_EXPIRES_IN ?? '2h';

  if (!segredo) {
    throw new Error('A variável JWT_SECRET não foi configurada');
  }

  if (!/^\d+[smhd]$/.test(expiracao)) {
    throw new Error('A variável JWT_EXPIRES_IN possui formato inválido');
  }

  return {
    segredo,
    expiracao: expiracao as SignOptions['expiresIn'],
  };
}
