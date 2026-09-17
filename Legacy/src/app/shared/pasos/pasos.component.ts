import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DxTooltipModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { PasosService } from './pasos.service';
//import * as StickyNavigation from './pasos.class.js';

@Component({
  selector: 'app-pasos',
  templateUrl: './pasos.component.html',
  styleUrls: ['./pasos.component.scss'],
	standalone: true,
	imports: [CommonModule, DxTooltipModule]
})
export class PasosComponent implements OnInit {
	@Input() prmdatos: any;

  itemsPasos: any;
	titPasos: string;
	subtitPasos: string;
	itemsPasosRuta: any;
  currentId : any;
  currentTab : any;
  tabContainerHeight: any = 70;
	visibleTooltip: boolean = false;
  subscription: Subscription;

  constructor(private _spasos: PasosService) 
  {
		this.generaPasos = this.generaPasos.bind(this);
	}

	// Muestra los pasos
	generaPasos(datprm) {
		this.itemsPasos = datprm.items;
		this.titPasos = datprm.titulo;
		this.subtitPasos = datprm.subtitulo;
	}

	// Navega a una pestaña del paso
	seleccTabPaso(item) {
		this.findCurrentTabSelector(item.idTab);
		this._spasos.setObsPasos(item);
	}

	// Ir a principal
	homeInformes() {
		this._spasos.setObsPasos('home');
	}
	
	onTabClick(event:any, element:any) {
		// event.preventDefault();
		// let scrollTop:any = $(element.attr('href')).offset().top - this.tabContainerHeight + 1;
		// $('html, body').animate({ scrollTop: scrollTop }, 600);
	}

	clickPasoRuta(itemRuta:any) {
		this._spasos.setObsPasos({ ruta: itemRuta});
	}
	
	onScroll(idTab:any) {
    this.findCurrentTabSelector(idTab); 
	}
	
	onResize() {
		if(this.currentId) {
			this.setSliderCss();
		}
	}
	
	checkTabContainerPosition() {
		// let offset:any = $('.et-pasos-tabs').offset().top + $('.et-pasos-tabs').height() - this.tabContainerHeight;
		// if($(window).scrollTop() > offset) {
		// 	$('.et-pasos-tabs-container').addClass('et-pasos-tabs-container--top');
		// } 
		// else {
		// 	$('.et-pasos-tabs-container').removeClass('et-pasos-tabs-container--top');
		// }
	}
	
	findCurrentTabSelector(idTab: any) {
    const tab = document.getElementsByClassName('et-pasos-tab');
    for (let k=0; k < tab.length; k++) {
			const e = tab[k];
      if (k === idTab) {
				if (e instanceof HTMLElement) {
					this.currentTab = e;
				}
			}
			if (e instanceof HTMLElement) {
				e.style.color = "black";
				e.style.background = "white";
			}
		}

		// Activa seleccion
    this.setSliderCss();
	}
	
	setSliderCss() {
		let width = 0;
		let left = 0;
		if(this.currentTab) {
			width = this.currentTab.offsetWidth;
			left = this.currentTab.offsetLeft - 1;
			this.currentTab.style.color = "white";
      this.currentTab.style.background = "rgba(175, 213, 246, 0.8)";
			this.currentTab.style.transition = "all 0.5s ease";
		}
    const tab = document.getElementsByClassName('et-pasos-tab-slider');
		for (let i = 0; i < tab.length; i++) {
      const e = tab[i];
      if (e instanceof HTMLElement) {
          e.style.width = width + "px";
          e.style.left = left + "px";
      }
    }
	}

	toggleHome() {
    this.visibleTooltip = !this.visibleTooltip;
  }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    // Instantiate
    setTimeout(() => {
			this.itemsPasos = this.prmdatos.items;
			this.titPasos = this.prmdatos.titulo;
			this.subtitPasos = this.prmdatos.subtitulo;
			this.itemsPasosRuta  = this.prmdatos.ruta;
		}, 300);
    setTimeout(() => {
      this.currentId = 0;
      this.currentTab = 0;
      this.tabContainerHeight = 70;
      let self = this;
      this.onScroll(0);
      this.onResize();
		}, 300);

	}

}
