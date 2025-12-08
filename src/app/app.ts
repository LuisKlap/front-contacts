import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrazilianDataService } from './home/service/brazilian-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('front-contacts');
  private brazilianData = inject(BrazilianDataService);

  ngOnInit(): void {
    // Pré-carrega dados brasileiros para ter disponível imediatamente
    this.brazilianData.getStates().subscribe({
      next: () => console.log('✅ Dados brasileiros carregados'),
      error: (err) => console.error('❌ Erro ao carregar dados brasileiros:', err)
    });
  }
}
