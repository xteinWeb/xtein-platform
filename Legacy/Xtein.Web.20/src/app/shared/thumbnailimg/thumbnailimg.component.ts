import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-thumbnailimg',
  templateUrl: './thumbnailimg.component.html',
  styleUrls: ['./thumbnailimg.component.css',
  "../../../assets/xtein.scss"],
  standalone: true,
  imports: [CommonModule]
})
export class ThumbnailimgComponent implements OnInit {

  @Input() listaImg: any;

  @Output() seleccImg = new EventEmitter<string>();

  slider: any;

  constructor() { }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    // Instantiate
    setTimeout(() => {
      const elem = document.getElementsByClassName("scroll-images");
      for (let i = 0; i < elem.length; i++) {
        const e = elem[i];
        if (e instanceof HTMLElement) {
          this.slider = e;
        }
      }
    }, 300);
	}

  ir_a_img(img: string) {
    this.seleccImg.emit(img);
  }

  preventClick = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
  isDown = false;
  isDragged = false;
  startX;
  scrollLeft;

  mousedown(e) {
    this.isDown = true;
    this.slider.classList.add("active");
    this.startX = e.pageX - this.slider.offsetLeft;
    this.scrollLeft = this.slider.scrollLeft;
  };

  mouseleave() {
    this.isDown = false;
    this.slider.classList.remove("active");
  };

  mouseup(e) {
    this.isDown = false;
    const elements = document.getElementsByClassName("child");
    if(this.isDragged){
        for(let i = 0; i<elements.length; i++){
              elements[i].addEventListener("click", this.preventClick);
        }
    }else{
        for(let i = 0; i<elements.length; i++){
              elements[i].removeEventListener("click", this.preventClick);
        }
    }
    this.slider.classList.remove("active");
    this.isDragged = false;
  };

  mousemove(e) {
    if (!this.isDown) return;
    this.isDragged =  true;
    e.preventDefault();
    const x = e.pageX - this.slider.offsetLeft;
    const walk = (x - this.startX) * 2;
    this.slider.scrollLeft = this.scrollLeft - walk;
  };

  leftScroll() {
    this.slider.scrollBy(200, 0);
    console.log('der');
  }
  rightScroll() {
    this.slider.scrollBy(-200, 0);
    console.log('izq');
  }

  ondragstart() {
    console.log("Drag start");
  };


}
