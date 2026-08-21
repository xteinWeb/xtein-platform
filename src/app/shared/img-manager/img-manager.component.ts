
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DxButtonModule, DxFileUploaderModule, DxPopupModule } from 'devextreme-angular';

export interface ImageFile {
  id: string;
  name: string;
  url: string;
  file?: File;
  size: number;
  type: string; 
  app?: string;
  item: string;
}

@Component({
    selector: 'app-img-manager',
    templateUrl: './img-manager.component.html',
    styleUrls: ['./img-manager.component.scss'],
    imports: [DxButtonModule, DxPopupModule, DxFileUploaderModule]
})
export class ImgManagerComponent  implements OnInit {
  @Input() images: ImageFile[] = [];
  @Input() maxImages: number = 10;
  @Input() maxFileSize: number = 5242880; // 5MB por defecto
  @Input() allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  @Input() readOnly: boolean = false;
  @Input() itemImage: string = "";
  
  @Output() imagesChange = new EventEmitter<ImageFile[]>();
  @Output() onImageAdded = new EventEmitter<ImageFile>();
  @Output() onImageRemoved = new EventEmitter<ImageFile>();

  selectedImage: ImageFile | null = null;
  showPreview: boolean = false;
  scale: number = 1;
  
  constructor() { }

  ngOnInit(): void {
    if (!this.images) {
      this.images = [];
    }
  }

  onFileSelected(event: any): void {
    const files = event.value;
    if (!files || files.length === 0) return;

    for (let file of files) {
      if (this.validateFile(file)) {
        this.addImage(file);
      }
    }
  }

  validateFile(file: File): boolean {
    // Validar tipo de archivo
    if (!this.allowedTypes.includes(file.type)) {
      alert(`Tipo de archivo no permitido: ${file.type}`);
      return false;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      alert(`El archivo ${file.name} excede el tamaño máximo de ${this.formatFileSize(this.maxFileSize)}`);
      return false;
    }

    // Validar cantidad máxima
    if (this.images.length >= this.maxImages) {
      alert(`Máximo de ${this.maxImages} imágenes permitidas`);
      return false;
    }

    return true;
  }

  addImage(file: File): void {
    const reader = new FileReader();
    const safeName = (file.name).replace(/[^a-zA-Z0-9._-]/g, "_");
    reader.onload = (e: any) => {
      const imageFile: ImageFile = {
        id: this.generateId(),
        name: safeName,
        url: e.target.result,
        file: file,
        size: file.size,
        type: file.type,
        app: 'image',
        item: this.itemImage
      };

      this.images.push(imageFile);
      this.imagesChange.emit(this.images);
      this.onImageAdded.emit(imageFile);
    };
    reader.readAsDataURL(file);
  }

  removeImage(image: ImageFile): void {
    const index = this.images.findIndex(img => img.id === image.id);
    if (index > -1) {
      this.images.splice(index, 1);
      this.imagesChange.emit(this.images);
      this.onImageRemoved.emit(image);
      
      if (this.selectedImage?.id === image.id) {
        this.closePreview();
      }
    }
  }

  async adicionarDiagrama () {
    const name = await new Promise<string | null>((resolve) => {
      const input = window.prompt('Nombre del diagrama:', `drawio-diagram${this.images.length + 1}`);
      resolve(input && input.trim() ? input.trim() : null);
    });
    if (!name) return;

    // Lógica para adicionar un diagrama
    const safeName = (name+'.png').replace(/[^a-zA-Z0-9._-]/g, "_");
    const emptyImage: ImageFile = {
      id: this.generateId(),
      name: safeName,
      url: '',
      size: 0,
      type: 'image/png',
      app: 'drawio',
      item: this.itemImage
    };
    this.images.push(emptyImage);
    this.imagesChange.emit(this.images);
    this.onImageAdded.emit(emptyImage);

    setTimeout(() => {
      const imgElements = document.querySelectorAll('img');
      const lastImg = Array.from(imgElements).find(img => img.src === emptyImage.url || img.alt === emptyImage.name);
      if (lastImg) {
        lastImg.classList.add('drawio');
        this.openDrawioEditor(lastImg as HTMLImageElement);
      }
    }, 0);

  }
  pegarImagen () {
    // Pegar imagen desde el portapapeles y adicionarla al array
    navigator.clipboard.read().then((items) => {
      for (const item of items) {
        for (const type of item.types) {
          if (this.allowedTypes.includes(type)) {
            item.getType(type).then((blob) => {
              const file = new File([blob], `pasted-image-${Date.now()}.${type.split('/')[1]}`, { type: type });
              if (this.validateFile(file)) {
                this.addImage(file);
              }
            });
            return; // Solo pegar la primera imagen válida
          }
        }
      }
      alert('No se encontraron imágenes válidas en el portapapeles.');
    }).catch((err) => {
      console.error('Error al leer del portapapeles: ', err);
      alert('No se pudo acceder al portapapeles.');
    });
  }

  onPaste(event: ClipboardEvent): void {
    // Prevenir el comportamiento por defecto
    event.preventDefault();

    // Obtener los items del portapapeles
    const items = event.clipboardData?.items;
    
    if (!items) return;

    // Iterar sobre los items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Verificar si el item es una imagen
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        
        if (blob) {
          // Crear URL para mostrar la imagen
          const file = new File([blob], `pasted-image-${Date.now()}.${item.type.split('/')[1]}`, { type: item.type });
          if (this.validateFile(file)) {
            this.addImage(file);
          }
          
          // Opcional: Convertir a base64 si necesitas enviarlo a un servidor
          // this.convertToBase64(blob);
        }
      }
    }
  }

  convertToBase64(blob: Blob): void {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const base64String = reader.result as string;
      console.log('Imagen en base64:', base64String);
      // Aquí puedes hacer lo que necesites con el base64
      // Por ejemplo, enviarlo a tu backend
    };
    
    reader.readAsDataURL(blob);
  }  

  ngAfterViewInit(): void {
    // Delegate dblclick event to images with class 'drawio'
    document.addEventListener('dblclick', (evt: MouseEvent) => {
      const source = evt.target as HTMLElement;
      if (source && source.nodeName === 'IMG' && source.classList.contains('drawio')) {
        this.openDrawioEditor(source as HTMLImageElement);
      }
    });
  }

  openDrawioEditor(img: HTMLImageElement): void {
    const url = 'https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&modified=unsavedChanges&proto=json';
    // @ts-ignore
    if (!img['drawIoWindow'] || img['drawIoWindow'].closed) {
      const receive = (evt: MessageEvent) => {
        // @ts-ignore
        if (evt.source === img['drawIoWindow'] && typeof evt.data === 'string' && evt.data.length > 0) {
          const msg = JSON.parse(evt.data);
          if (msg.event === 'init') {
            // @ts-ignore
            img['drawIoWindow'].postMessage(JSON.stringify({ action: 'load', xmlpng: img.src }), '*');
          } else if (msg.event === 'save') {
            // @ts-ignore
            img['drawIoWindow'].postMessage(JSON.stringify({ action: 'export', format: 'xmlpng', spinKey: 'saving' }), '*');
          } else if (msg.event === 'export') {
            img.src = msg.data;
          }
          if (msg.event === 'exit' || msg.event === 'export') {
            window.removeEventListener('message', receive);
            // @ts-ignore
            img['drawIoWindow'].close();
            // @ts-ignore
            img['drawIoWindow'] = null;

            // Actualizar la imagen en el array
            const index = this.images.findIndex(i => i.name === img.alt || i.url === img.src);
            if (index > -1) {
              this.images[index].url = img.src;
              this.imagesChange.emit(this.images);
            } 

          }
        }
      };
      window.addEventListener('message', receive);
      // @ts-ignore
      img['drawIoWindow'] = window.open(url);
    } else {
      // @ts-ignore
      img['drawIoWindow'].focus();
    }
  } 

  openPreview(image: ImageFile): void {
    if (!image.app?.includes('drawio')) {
      this.selectedImage = image;
      this.showPreview = true;
    }
    else {
      const imgElements = document.querySelectorAll('img');
      const targetImg = Array.from(imgElements).find(
        img => img.alt === image.name && img.src === image.url
      );
      if (targetImg) {
        this.openDrawioEditor(targetImg as HTMLImageElement);
      }
    }

  }

  closePreview(): void {
    this.selectedImage = null;
    this.showPreview = false;
  }

  clearAllImages(): void {
    if (confirm('¿Está seguro de eliminar todas las imágenes?')) {
      this.images = [];
      this.imagesChange.emit(this.images);
      this.closePreview();
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  getImageCount(): string {
    return `${this.images.length} / ${this.maxImages}`;
  }

  allowedFiles(allowedTypes) {
    return allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
  }

  onWheel(event: WheelEvent, img: HTMLElement) {
    event.preventDefault();

    // Ajusta el zoom
    this.scale += event.deltaY * -0.001;

    // Límites de zoom
    this.scale = Math.min(Math.max(0.5, this.scale), 5);

    img.style.transform = `scale(${this.scale})`;
  }

}
