import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.page').then((modulo) => modulo.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout.component').then(
        (modulo) => modulo.AdminLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard | PetzIn',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then(
            (modulo) => modulo.DashboardPage,
          ),
      },
      {
        path: 'tutores',
        title: 'Tutores | PetzIn',
        loadComponent: () =>
          import('./features/tutores/tutores.page').then(
            (modulo) => modulo.TutoresPage,
          ),
      },
      {
        path: 'tutores/novo',
        title: 'Novo tutor | PetzIn',
        loadComponent: () =>
          import('./features/tutores/tutor-form.page').then(
            (modulo) => modulo.TutorFormPage,
          ),
      },
      {
        path: 'tutores/:id/editar',
        title: 'Editar tutor | PetzIn',
        loadComponent: () =>
          import('./features/tutores/tutor-form.page').then(
            (modulo) => modulo.TutorFormPage,
          ),
      },
      {
        path: 'pets',
        title: 'Pets | PetzIn',
        loadComponent: () =>
          import('./features/pets/pets.page').then((modulo) => modulo.PetsPage),
      },
      {
        path: 'pets/novo',
        title: 'Cadastrar pet | PetzIn',
        loadComponent: () =>
          import('./features/pets/pet-form.page').then(
            (modulo) => modulo.PetFormPage,
          ),
      },
      {
        path: 'pets/:id/editar',
        title: 'Editar pet | PetzIn',
        loadComponent: () =>
          import('./features/pets/pet-form.page').then(
            (modulo) => modulo.PetFormPage,
          ),
      },
      {
        path: 'pets/:id/prontuario',
        title: 'Prontuário clínico | PetzIn',
        loadComponent: () =>
          import('./features/cuidados/prontuario.page').then(
            (modulo) => modulo.ProntuarioPage,
          ),
      },
      {
        path: 'reservas',
        title: 'Reservas | PetzIn',
        loadComponent: () =>
          import('./features/reservas/reservas.page').then(
            (modulo) => modulo.ReservasPage,
          ),
      },
      {
        path: 'reservas/nova',
        title: 'Nova reserva | PetzIn',
        loadComponent: () =>
          import('./features/reservas/nova-reserva.page').then(
            (modulo) => modulo.NovaReservaPage,
          ),
      },
      {
        path: 'reservas/:id/editar',
        title: 'Editar reserva | PetzIn',
        loadComponent: () =>
          import('./features/reservas/nova-reserva.page').then(
            (modulo) => modulo.NovaReservaPage,
          ),
      },
      {
        path: 'reservas/:id',
        title: 'Detalhes da reserva | PetzIn',
        loadComponent: () =>
          import('./features/reservas/reserva-detalhes.page').then(
            (modulo) => modulo.ReservaDetalhesPage,
          ),
      },
      {
        path: 'reservas/:id/cuidados',
        title: 'Cuidados da hospedagem | PetzIn',
        loadComponent: () =>
          import('./features/cuidados/cuidados-reserva.page').then(
            (modulo) => modulo.CuidadosReservaPage,
          ),
      },
      {
        path: 'medicamentos',
        title: 'Lembretes de medicamentos | PetzIn',
        loadComponent: () =>
          import('./features/cuidados/medicamentos.page').then(
            (modulo) => modulo.MedicamentosPage,
          ),
      },
      {
        path: 'financeiro',
        title: 'Financeiro | PetzIn',
        loadComponent: () =>
          import('./features/financeiro/financeiro.page').then(
            (modulo) => modulo.FinanceiroPage,
          ),
      },
      {
        path: 'configuracoes/senha',
        title: 'Alterar senha | PetzIn',
        loadComponent: () =>
          import('./features/configuracoes/alterar-senha.page').then(
            (modulo) => modulo.AlterarSenhaPage,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
