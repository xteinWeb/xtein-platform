import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApplicationHostComponent } from './application-host/application-host.component';

@Component({
  selector: 'xtein-mcpr-root',
  standalone: true,
  imports: [ApplicationHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {}
