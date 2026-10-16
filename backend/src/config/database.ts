import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'node:path';
import { DataSource } from 'typeorm';
import { Pet } from '../entities/Pet';
import { Reserva } from '../entities/Reserva';
import { Tutor } from '../entities/Tutor';
import { Usuario } from '../entities/Usuario';
import { CriarTabelaUsuarios1792092861341 } from '../migrations/1792092861341-CriarTabelaUsuarios';
import { AdicionarEstruturaPets1792096000000 } from '../migrations/1792096000000-AdicionarEstruturaPets';
import { AdicionarReservas1792182400000 } from '../migrations/1792182400000-AdicionarReservas';
import { AdicionarControleFinanceiro1792186000000 } from '../migrations/1792186000000-AdicionarControleFinanceiro';

dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
});

// Configura a conexão com o PostgreSQL
export const AppDataSource = new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST ?? 'localhost',

  port: Number(process.env.DB_PORT ?? 5433),

  username: process.env.POSTGRES_USER,

  password: process.env.POSTGRES_PASSWORD,

  database: process.env.POSTGRES_DB,

  synchronize: false,

  logging: false,

  entities: [Usuario, Tutor, Pet, Reserva],

  migrations: [
    CriarTabelaUsuarios1792092861341,
    AdicionarEstruturaPets1792096000000,
    AdicionarReservas1792182400000,
    AdicionarControleFinanceiro1792186000000,
  ],
});
