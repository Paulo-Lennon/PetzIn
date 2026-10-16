import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import { Pet } from './Pet';

const transformarDecimal: ValueTransformer = {
  to: (valor: number) => valor,
  from: (valor: string) => Number(valor),
};

export enum ModalidadeCobranca {
  HORA = 'HORA',
  DIARIA = 'DIARIA',
}

export enum StatusReserva {
  AGENDADA = 'AGENDADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  PARCIAL = 'PARCIAL',
  PAGO = 'PAGO',
}

@Entity('reservas')
@Index('IDX_reservas_pet_id', ['petId'])
@Index('IDX_reservas_canil_periodo', [
  'numeroCanil',
  'dataEntrada',
  'dataSaida',
])
@Index('IDX_reservas_status', ['status'])
@Index('IDX_reservas_status_pagamento', ['statusPagamento'])
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  petId!: string;

  @ManyToOne(() => Pet, (pet) => pet.reservas, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'petId' })
  pet!: Pet;

  @Column({ type: 'timestamptz' })
  dataEntrada!: Date;

  @Column({ type: 'timestamptz' })
  dataSaida!: Date;

  @Column({ type: 'integer' })
  numeroCanil!: number;

  @Column({ type: 'enum', enum: ModalidadeCobranca })
  modalidade!: ModalidadeCobranca;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: transformarDecimal,
  })
  tarifaHora!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: transformarDecimal,
  })
  tarifaDiaria!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: transformarDecimal,
  })
  valorTotal!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: transformarDecimal,
  })
  valorPago!: number;

  @Column({
    type: 'enum',
    enum: StatusPagamento,
    default: StatusPagamento.PENDENTE,
  })
  statusPagamento!: StatusPagamento;

  @Column({ type: 'timestamptz', nullable: true })
  pagoEm!: Date | null;

  @Column({
    type: 'enum',
    enum: StatusReserva,
    default: StatusReserva.AGENDADA,
  })
  status!: StatusReserva;

  @Column({ type: 'text', nullable: true })
  observacoes!: string | null;

  @CreateDateColumn()
  criadoEm!: Date;

  @UpdateDateColumn()
  atualizadoEm!: Date;
}
