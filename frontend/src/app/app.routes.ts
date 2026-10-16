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
        path: 'pets',
        title: 'Pets | PetzIn',
        loadComponent: () =>
          import('./features/pets/pets.page').then((modulo) => modulo.PetsPage),
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
        path: 'financeiro',
        title: 'Financeiro | PetzIn',
        loadComponent: () =>
          import('./features/financeiro/financeiro.page').then(
            (modulo) => modulo.FinanceiroPage,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];
