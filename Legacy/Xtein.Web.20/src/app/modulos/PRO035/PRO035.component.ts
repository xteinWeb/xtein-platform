import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTabPanelModule } from 'devextreme-angular';
import { PRO036Component } from './pro036/pro036.component';
import { PRO037Component } from './pro037/pro037.component';
import { PRO038Component } from './pro038/pro038.component';

@Component({
  selector: 'app-PRO035',
  templateUrl: './PRO035.component.html',
  styleUrls: ['./PRO035.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    DxTabPanelModule,
    PRO036Component,
    PRO037Component,
    PRO038Component
  ]
})
export class PRO035Component implements OnInit {

  tabs = [
    { id: 0, text: 'Crear MDP' },
    { id: 1, text: 'Gestionar MDP' },
    { id: 2, text: 'Historico MDP' }
  ];

  selectedIndex = 1; // Por defecto mostramos "Gestionar MDP"

  constructor() { }

  ngOnInit(): void {
  }

}
