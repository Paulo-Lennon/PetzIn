import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarControleFinanceiro1792186000000
  implements MigrationInterface
{
  name = 'AdicionarControleFinanceiro1792186000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."reservas_status_pagamento_enum" AS ENUM('PENDENTE', 'PARCIAL', 'PAGO')`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas" ADD "valorPago" numeric(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas" ADD "statusPagamento" "public"."reservas_status_pagamento_enum" NOT NULL DEFAULT 'PENDENTE'`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas" ADD "pagoEm" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas" ADD CONSTRAINT "CHK_reservas_valor_pago" CHECK ("valorPago" >= 0 AND "valorPago" <= "valorTotal")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reservas_status_pagamento" ON "reservas" ("statusPagamento")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_reservas_status_pagamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservas" DROP CONSTRAINT "CHK_reservas_valor_pago"`,
    );
    await queryRunner.query(`ALTER TABLE "reservas" DROP COLUMN "pagoEm"`);
    await queryRunner.query(
      `ALTER TABLE "reservas" DROP COLUMN "statusPagamento"`,
    );
    await queryRunner.query(`ALTER TABLE "reservas" DROP COLUMN "valorPago"`);
    await queryRunner.query(
      `DROP TYPE "public"."reservas_status_pagamento_enum"`,
    );
  }
}
