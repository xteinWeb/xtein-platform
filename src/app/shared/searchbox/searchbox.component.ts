
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input, EventEmitter, Output, HostListener } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DxButtonModule } from 'devextreme-angular';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, tap } from 'rxjs/operators';
import { GeneralesService } from 'src/app/services/generales/generales.service';

interface SearchResult {
  id: string;
  name: string;
  // Add more properties as needed
}

@Component({
    selector: 'app-searchbox',
    templateUrl: './searchbox.component.html',
    styleUrls: ['./searchbox.component.scss'],
    imports: [ReactiveFormsModule, DxButtonModule]
})
export class SearchboxComponent implements OnInit, OnDestroy {
  @ViewChild('searchInputElement') searchInputElement!: ElementRef;
  
  searchControl = new FormControl();
  results: SearchResult[] = [];
  columnas: any;
  isLoading = false;
  showDropdown = false;
  hasText = false;
  inputWidth = 0;
  seleccionados: any[] = [];
  private destroy$ = new Subject<void>();
  
  @Input() events: Observable<any>;
  @Output() onRespuestaAutosearch = new EventEmitter<any>;

  @Input() accion: any;

  constructor(private _sdatos: GeneralesService) {}
  
  ngOnInit(): void {

    this.searchControl.valueChanges.pipe(
      tap(value => {
        // Update hasText flag based on whether there's text
        this.hasText = !!value;
      }),
      debounceTime(300), // Wait for 300ms pause in events
      distinctUntilChanged(), // Only emit when the current value is different from the last
      tap(() => {
        this.isLoading = true;
        // Only show dropdown when there's search text
        this.showDropdown = !!this.searchControl.value;
      }),
      switchMap(term => this.searchItems(term)),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      let res = JSON.stringify(data);
      const result = JSON.parse(res);
      let r1 = [];
      this.columnas = [];
      if (result.length !=0 ) {
        if (result.data != "" )
          r1 = JSON.parse(result.data);
        this.columnas = Object.keys(r1[0]);
      }
      this.results = r1;
      this.isLoading = false;
    });
  }
  
  ngAfterViewInit(): void {
    // Set initial width
    this.updateDropdownWidth();
    
    // Set up resize observer to update width when input resizes
    const resizeObserver = new ResizeObserver(() => {
      this.updateDropdownWidth();
    });
    
    resizeObserver.observe(this.searchInputElement.nativeElement);
  }
  
  updateDropdownWidth(): void {
    if (this.searchInputElement)
      this.inputWidth = this.searchInputElement.nativeElement.offsetWidth + 200;
  }
  
  clearSearch(): void {
    this.searchControl.setValue('');
    this.showDropdown = false;
    if (this.searchInputElement)
      this.searchInputElement.nativeElement.focus();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  searchItems(term: string): Observable<SearchResult[]> {
    // If empty string, return empty array
    if (!term.trim()) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    
    // Parámetros de búsqueda
    const vprm = this.accion.split('|');

    // Replace with your actual API endpoint
    const prm = {FILTRO: term, accion: vprm[1]};
    return this._sdatos.consulta('autobusqueda',prm, vprm[0]);
    // return this.http.get<SearchResult[]>(`https://your-api-endpoint/search?q=${term}`);
  }
  
  selectItem(item: SearchResult): void {

    // Para selección múltiple
    const tmp = this.searchControl.value.split(';')
    let datosInput = '';
    for (var k=0; k < tmp.length-1; k++) {
      datosInput = datosInput + (datosInput != "" ? ";": "") + tmp[k];
    };
    if (datosInput == "") 
      datosInput = item[this.columnas[0]];
    else
      datosInput = datosInput+ ";" + item[this.columnas[0]];

    // this.searchControl.setValue(item[this.columnas[0]]);
    this.searchControl.setValue(datosInput);
    this.showDropdown = false;

    // Perform any additional actions when an item is selected
    console.log('Selected item:', item);
    this.onRespuestaAutosearch.emit(item[this.columnas[0]]);

  }
  
  onBlur(): void {
    // Small delay to allow click events on dropdown items to fire first
    // this.onRespuestaAutosearch.emit(this.searchControl.value);
    setTimeout(() => {
      this.showDropdown = true;
    }, 150);
  }
  
  onFocus(): void {
    // Show dropdown again on focus if there's text
    if (this.searchControl.value) {
      this.showDropdown = true;
    }

  }

  // @HostListener('wheel', ['$event'])
  // onWheel(event: WheelEvent) {
  //   const element = event.currentTarget as HTMLElement;

  //   const atTop = element.scrollTop === 0 && event.deltaY < 0;
  //   const atBottom =
  //     element.scrollHeight - element.scrollTop === element.clientHeight &&
  //     event.deltaY > 0;

  //   if (atTop || atBottom) {
  //     event.preventDefault();
  //     event.stopPropagation();
  //     element.style.pointerEvents="auto";
  //   }
  // }

  onMouseWheel(event: WheelEvent): void {
    event.stopPropagation();
  }

  isSelected(item: any): boolean {
    return this.seleccionados.some(p => p.id === item.id);
  }

  toggleSeleccion(item: any) {
    if (this.isSelected(item)) {
      this.seleccionados = this.seleccionados.filter(p => p.id !== item.id);
    } else {
      this.seleccionados.push(item);
    }
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.seleccionados = checked ? [...this.results] : [];
  }

  clickSelecc(e: any) {

    let datosInput = "";
    for (var k=0; k <= this.seleccionados.length-1; k++) {
      datosInput = datosInput + (datosInput != "" ? ";": "") + this.seleccionados[k][this.columnas[0]];
    };

    this.searchControl.setValue(datosInput);

    // Perform any additional actions when an item is selected
    console.log('Selected item:', datosInput);
    this.onRespuestaAutosearch.emit(datosInput);

    setTimeout(() => {
      this.showDropdown = false;
    }, 150);

  }

}
