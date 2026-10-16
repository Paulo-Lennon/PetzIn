import 'reflect-metadata';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppDataSource } from '../config/database';
import { SexoPet } from '../entities/Pet';
import { PetRepository } from '../repositories/PetRepository';
import { TutorRepository } from '../repositories/TutorRepository';

let tutorId: string | undefined;
let petId: string | undefined;

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const tutor = TutorRepository.create({
    nome: 'Tutor de Teste',
    telefone: '92999999999',
    email: `teste.pet.${Date.now()}@petzin.local`,
  });
  const tutorSalvo = await TutorRepository.save(tutor);
  tutorId = tutorSalvo.id;

  const pet = PetRepository.create({
    nome: 'Rex',
    especie: 'Cachorro',
    raca: 'Labrador',
    sexo: SexoPet.MACHO,
    dataNascimento: '2021-05-10',
    pesoAtual: 28.5,
    observacoes: 'Pet criado exclusivamente para o teste de integração.',
    tutorId,
  });
  const petSalvo = await PetRepository.save(pet);
  petId = petSalvo.id;
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    if (petId) {
      await PetRepository.delete({ id: petId });
    }

    if (tutorId) {
      await TutorRepository.delete({ id: tutorId });
    }

    await AppDataSource.destroy();
  }
});

describe('Entidade Pet', () => {
  it('persiste o pet associado a um único tutor', async () => {
    const pet = await PetRepository.createQueryBuilder('pet')
      .innerJoinAndSelect('pet.tutor', 'tutor')
      .where('pet.id = :petId', { petId })
      .andWhere('pet.tutorId = :tutorId', { tutorId })
      .getOne();

    expect(pet).not.toBeNull();
    expect(pet).toMatchObject({
      id: petId,
      nome: 'Rex',
      especie: 'Cachorro',
      raca: 'Labrador',
      sexo: SexoPet.MACHO,
      dataNascimento: '2021-05-10',
      ativo: true,
      tutorId,
    });
    expect(Number(pet?.pesoAtual)).toBe(28.5);
    expect(pet?.tutor.telefone).toBe('92999999999');
  });

  it('não encontra o pet ao consultar com outro tutor', async () => {
    const pet = await PetRepository.findOne({
      where: {
        id: petId,
        tutorId: '00000000-0000-0000-0000-000000000000',
      },
    });

    expect(pet).toBeNull();
  });

  it('impede excluir um tutor que ainda possui pet', async () => {
    await expect(TutorRepository.delete({ id: tutorId })).rejects.toThrow();
  });
});
