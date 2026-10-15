import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// Define a tabela no PostgreSQL
@Entity('usuarios')
export class Usuario {
  // Identificador único gerado automaticamente
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Nome do usuário
  @Column({ type: 'varchar', length: 150 })
  nome!: string;

  // E-mail obrigatório e único
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  // Senha armazenada como hash, nunca em texto puro
  @Column({ type: 'varchar', length: 255, select: false })
  senhaHash!: string;

  // Data de criação do cadastro
  @CreateDateColumn()
  criadoEm!: Date;
}
