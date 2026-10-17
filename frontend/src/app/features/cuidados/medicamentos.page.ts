import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LembreteMedicamento } from '../../core/models/cuidados.model';
import { CuidadosService } from '../../core/services/cuidados.service';

@Component({
  selector: 'app-medicamentos-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './medicamentos.page.html',
  styleUrl: './cuidados.page.css',
})
export class MedicamentosPage implements OnInit {
  private readonly cuidadosService = inject(CuidadosService);
  protected readonly lembretes = signal<LembreteMedicamento[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  ngOnInit(): void {
    this.cuidadosService.listarLembretes({ status: 'PENDENTE' })
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({ next: (itens) => this.lembretes.set(itens), error: () => this.erro.set(true) });
  }

  protected atrasado(lembrete: LembreteMedicamento): boolean {
    return new Date(lembrete.horarioProgramado).getTime() < Date.now();
  }
}
