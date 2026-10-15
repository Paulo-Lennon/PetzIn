import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
});
import { DataSource } from 'typeorm';

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

  entities: [],

  migrations: [],
});
