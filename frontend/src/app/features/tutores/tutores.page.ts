import { Component, inject, OnInit, signal } from '@angular/core';
import { Tutor } from '../../core/models/tutor.model';
import { TutorService } from '../../core/services/tutor.service';

@Component({
  selector: 'app-tutores-page',
  templateUrl: './tutores.page.html',
})
export class TutoresPage implements OnInit {
  private readonly tutorService = inject(TutorService);

  protected readonly tutores = signal<Tutor[]>([]);
  protected readonly carregando = signal(true);
  protected readonly erro = signal(false);

  ngOnInit(): void {
    this.tutorService.listar().subscribe({
      next: (tutores) => {
        this.tutores.set(tutores);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }
}
