import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pet } from './Pet';
import { Reserva } from './Reserva';

export enum StatusLembreteMedicamento {
  PENDENTE = 'PENDENTE',
  ADMINISTRADO = 'ADMINISTRADO',
  NAO_ADMINISTRADO = 'NAO_ADMINISTRADO',
  CANCELADO = 'CANCELADO',
}

@Entity('lembretes_medicamentos')
@Index('IDX_lembretes_medicamentos_horario_status', [
  'horarioProgramado',
  'status',
])
@Index('IDX_lembretes_medicamentos_reserva', ['reservaId'])
export class LembreteMedicamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  petId!: string;

  @ManyToOne(() => Pet, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'petId' })
  pet!: Pet;

  @Column({ type: 'uuid' })
  reservaId!: string;

  @ManyToOne(() => Reserva, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservaId' })
  reserva!: Reserva;

  @Column({ type: 'varchar', length: 150 })
  medicamento!: string;

  @Column({ type: 'varchar', length: 100 })
  dosagem!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  viaAdministracao!: string | null;

  @Column({ type: 'timestamptz' })
  horarioProgramado!: Date;

  @Column({
    type: 'enum',
    enum: StatusLembreteMedicamento,
    default: StatusLembreteMedicamento.PENDENTE,
  })
  status!: StatusLembreteMedicamento;

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  administradoEm!: Date | null;

  @Column({ type: 'text', nullable: true })
  motivoNaoAdministrado!: string | null;

  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn()
  atualizadoEm!: Date;
}
