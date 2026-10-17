import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from './Pet';

@Entity('fichas_clinicas')
export class FichaClinica {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  petId!: string;

  @OneToOne(() => Pet, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'petId' })
  pet!: Pet;

  @Column({ type: 'boolean', nullable: true })
  vacinasEmDia!: boolean | null;

  @Column({ type: 'text', nullable: true })
  alergias!: string | null;

  @Column({ type: 'text', nullable: true })
  condicoesClinicas!: string | null;

  @Column({ type: 'text', nullable: true })
  restricoesAlimentares!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  veterinarioNome!: string | null;

  @Column({ type: 'varchar', length: 15, nullable: true })
  veterinarioTelefone!: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null;

  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn()
  atualizadoEm!: Date;
}
