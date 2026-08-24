import { Component } from '@angular/core';
import { ShellLayout } from './layout/shell-layout/shell-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ShellLayout
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {

}