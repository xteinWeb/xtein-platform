// pdf-manager.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DxButtonModule, DxFileUploaderModule, DxPopupModule } from 'devextreme-angular';
import { SafePipe } from './safe.pipe';

export interface PdfFile {
  id: string;
  name: string;
  url: string;
  file?: File;
  size: number;
  type: string;
  pages?: number;
  app?: string;
  item?: string;
}

@Component({
    selector: 'app-pdf-manager',
    templateUrl: './pdf-manager.component.html',
    styleUrls: ['./pdf-manager.component.scss'],
    imports: [DxButtonModule, DxPopupModule, DxFileUploaderModule, SafePipe]
})
export class PdfManagerComponent implements OnInit {
  @Input() pdfs: PdfFile[] = [];
  @Input() maxPdfs: number = 5;
  @Input() maxFileSize: number = 10485760; // 10MB por defecto
  @Input() readOnly: boolean = false;
  @Input() itemPdf: string = "";
  
  @Output() pdfsChange = new EventEmitter<PdfFile[]>();
  @Output() onPdfAdded = new EventEmitter<PdfFile>();
  @Output() onPdfRemoved = new EventEmitter<PdfFile>();

  selectedPdf: PdfFile | null = null;
  showPreview: boolean = false;

  constructor() { }

  ngOnInit(): void {
    if (!this.pdfs) {
      this.pdfs = [];
    }
  }

  onFileSelected(event: any): void {
    const files = event.value;
    if (!files || files.length === 0) return;

    for (let file of files) {
      if (this.validateFile(file)) {
        this.addPdf(file);
      }
    }
  }

  validateFile(file: File): boolean {
    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      alert(`Solo se permiten archivos PDF. Tipo recibido: ${file.type}`);
      return false;
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      alert(`El archivo ${file.name} excede el tamaño máximo de ${this.formatFileSize(this.maxFileSize)}`);
      return false;
    }

    // Validar cantidad máxima
    if (this.pdfs.length >= this.maxPdfs) {
      alert(`Máximo de ${this.maxPdfs} archivos PDF permitidos`);
      return false;
    }

    return true;
  }

  addPdf(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const pdfFile: PdfFile = {
        id: this.generateId(),
        name: file.name,
        url: e.target.result,
        file: file,
        size: file.size,
        type: file.type,
        app: 'pdf',
        item: this.itemPdf
      };

      this.pdfs.push(pdfFile);
      this.pdfsChange.emit(this.pdfs);
      this.onPdfAdded.emit(pdfFile);
    };
    reader.readAsDataURL(file);
  }

  removePdf(pdf: PdfFile): void {
    const index = this.pdfs.findIndex(p => p.id === pdf.id);
    if (index > -1) {
      this.pdfs.splice(index, 1);
      this.pdfsChange.emit(this.pdfs);
      this.onPdfRemoved.emit(pdf);
      
      if (this.selectedPdf?.id === pdf.id) {
        this.closePreview();
      }
    }
  }

  openPreview(pdf: PdfFile): void {
    this.selectedPdf = pdf;
    this.showPreview = true;
  }

  closePreview(): void {
    this.selectedPdf = null;
    this.showPreview = false;
  }

  clearAllPdfs(): void {
    if (confirm('¿Está seguro de eliminar todos los archivos PDF?')) {
      this.pdfs = [];
      this.pdfsChange.emit(this.pdfs);
      this.closePreview();
    }
  }

  downloadPdf(pdf: PdfFile): void {
    const link = document.createElement('a');
    link.href = pdf.url;
    link.download = pdf.name;
    link.click();
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

  getPdfCount(): string {
    return `${this.pdfs.length} / ${this.maxPdfs}`;
  }

  getFileIcon(): string {
    return 'dx-icon-pdffile';
  }
}