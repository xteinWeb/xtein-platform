import { Component, Input, OnInit } from '@angular/core';
import { estados0 } from '../classes/estados';

@Component({
  selector: 'app-estado',
  templateUrl: './estado.component.html',
  styleUrls: ['./estado.component.scss'],
  standalone: true,
  imports: []
})
export class EstadoComponent implements OnInit {
  
  @Input() value: estados0;

  @Input() modo: string = '';

  @Input() input?: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

}
