import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrazilianDataService } from './home/service/brazilian-data.service';
import { environment } from '../environments/environment';

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
    // Carrega script do Google Maps dinamicamente
    this.loadGoogleMapsScript();

    // Pré-carrega dados brasileiros para ter disponível imediatamente
    this.brazilianData.getStates().subscribe({
      next: () => console.log('✅ Dados brasileiros carregados'),
      error: (err) => console.error('❌ Erro ao carregar dados brasileiros:', err)
    });
  }

  private loadGoogleMapsScript(): void {
    const apiKey = environment.googleMapsApiKey;
    if (!apiKey) {
      console.error('❌ Google Maps API Key não configurada');
      return;
    }

    const scriptElement = document.getElementById('google-maps-script');
    if (scriptElement && !scriptElement.getAttribute('src')) {
      scriptElement.setAttribute('src',
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-BR`
      );
    }
  }
}
