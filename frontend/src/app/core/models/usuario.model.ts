export interface Usuario {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}

export interface RespostaLogin {
  token: string;
  usuario: Usuario;
}
