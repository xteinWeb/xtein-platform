import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import Swal from 'sweetalert2';

interface Tag {
  id: number;
  name: string;
  asociado: string;
}

@Component({
  selector: 'app-CXC22003',
  templateUrl: './CXC22003.component.html',
  styleUrls: ['./CXC22003.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CXC22003Component implements OnInit {
  private counter = 1;

  tags: Tag[] = [];

  editBuffer = '';

  @Input() events: Observable<any>;
  @Output() tagAdded = new EventEmitter<any>();
  private eventsSubscription: Subscription;

  @ViewChild('newTagInput') newTagInput!: ElementRef<HTMLInputElement>;

  addTag(): void {
    // if (this.counter > 0 && this.tags[this.tags.length - 1].name.match("<Titular>|<Nuevo Codeudor>")) {
    //   this.showModal('Debe completar los datos del asociado antes de agregar uno nuevo.');
    //   return;
    // }
    // this.tagAdded.emit({ id: this.counter, name: 'validar', asociado: '' });

    this.tagAdded.emit({ accion: 'add' });

    // const name = `Tag ${this.counter}`;
    // const name = '<Nuevo Codeudor>';
    // const newTag: Tag = { id: this.counter++, name, asociado: '<Nuevo Codeudor>' };
    // this.tags.push(newTag);
    // this.tagAdded.emit(newTag);
  }

  removeTag(id: number): void {
    const tag = this.tags.find((t) => t.id == id);
    this.tagAdded.emit({ accion: 'remove', dato: tag });
  }
  onTagClick(tag: Tag): void {
    this.tagAdded.emit({ accion: 'seleccionar', dato: tag });
  }

  ngOnInit(): void {
    this.eventsSubscription = this.events.subscribe((datosTags: any) => {
      this.tags = datosTags;
    });
  }

  ngOnDestroy(): void {
    if (this.eventsSubscription) {
      this.eventsSubscription.unsubscribe();
    }
  }

  showModal(mensaje, titulo = '', html = '') {
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: '#0F4C81',
      title: '¡Error!',
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      html,
      stopKeydownPropagation: false,
    });
  }
}
