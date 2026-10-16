import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/database';

const PORT = 3000;

// Inicializa a conexão com o PostgreSQL
async function iniciarServidor() {
  try {
    await AppDataSource.initialize();

    console.log('PostgreSQL conectado com sucesso!');

    // Inicia o servidor somente após conectar ao banco
    app.listen(PORT, () => {
      console.log(`PetzIn API rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error);
    process.exit(1);
  }
}

iniciarServidor();
