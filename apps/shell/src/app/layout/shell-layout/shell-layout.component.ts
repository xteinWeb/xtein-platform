import { Component } from '@angular/core';
import { Header } from '../header/header.component';
import { Sidebar } from '../../navigation/sidebar/sidebar.component';
import { PlatformToolbar } from '../../toolbar/platform-toolbar/platform-toolbar.component';
import { Workspace } from '../../workspace/workspace/workspace.component';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [
    Header,
    Sidebar,
    PlatformToolbar,
    Workspace
  ],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
export class ShellLayout {

}