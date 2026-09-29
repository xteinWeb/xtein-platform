import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-GES00106',
  templateUrl: './GES00106.component.html',
  styleUrls: ['./GES00106.component.css'],
  standalone: true,
  imports: []
})
export class GES00106Component implements OnInit {

  tasks: any [];
  dependencies: any [];
  resources: any [];
  resourceAssignments: any [];

  constructor() { }

  ngOnInit(): void {
  }

}
