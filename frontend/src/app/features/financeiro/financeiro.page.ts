import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ResumoFinanceiro } from '../../core/models/financeiro.model';
import { FinanceiroService } from '../../core/services/financeiro.service';

@Component({
  selector: 'app-financeiro-page',
  imports: [CurrencyPipe],
  templateUrl: './financeiro.page.html',
  styleUrl: './financeiro.page.css',
})
export class FinanceiroPage implements OnInit {
  private readonly financeiroService = inject(FinanceiroService);

  protected readonly resumo = signal<ResumoFinanceiro | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  ngOnInit(): void {
    this.financeiroService.obterResumo().subscribe({
      next: (resumo) => {
        this.resumo.set(resumo);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }
}
