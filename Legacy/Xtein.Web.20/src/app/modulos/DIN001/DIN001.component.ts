import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DxFileManagerModule } from 'devextreme-angular';
import RemoteFileSystemProvider from 'devextreme/file_management/remote_provider';
import CustomFileSystemProvider from 'devextreme/file_management/custom_provider';
import { clsBarraRegistro } from 'src/app/containers/regbarra/_clsBarraReg';
import { SbarraService } from 'src/app/containers/regbarra/_sbarra.service';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-DIN001',
  templateUrl: './DIN001.component.html',
  styleUrls: ['./DIN001.component.css'],
  standalone: true,
  imports: [CommonModule, DxFileManagerModule]
})
export class DIN001Component {

  private endPoint = environment.apiDiseno;
  private userSistem = environment.userDiseno;
  private passSistem = environment.passUserDiseno;

  remoteProvider: RemoteFileSystemProvider;
  prmUsrAplBarReg: clsBarraRegistro;
  fileSystemProvider: any;

  PermisosUsuario:any = {
    create: false,
    copy: false,
    move: false,
    delete: false,
    rename: false,
    upload: false,
    download: true
  };

  USUARIO_LOCAL:any = '';



  constructor(
    private _sbarreg: SbarraService 
  ) {
    // this.remoteProvider = new RemoteFileSystemProvider({
    //   // endpointUrl: 'https://js.devexpress.com/Demos/NetCore/api/file-manager-file-system-images',
    //   endpointUrl: 'https://apidiseno.colchonessunmoon.com//files',
    // });
    // this.fileSystemProvider = new CustomFileSystemProvider({
    //   getItems: this.getItems.bind(this),
    //   downloadFile: this.downloadFile.bind(this),
    //   hasSubDirectoriesExpr: 'hasSubDirectories'
    // });
  }

  
  ngOnInit(): void {
    this.USUARIO_LOCAL = localStorage.getItem('usuario');
    this.prmUsrAplBarReg = {
      tabla: '',
      aplicacion: 'DIN-001',
      usuario: this.USUARIO_LOCAL,
      accion: 'r_ini',
      error: '',
      r_numReg: 0,
      r_totReg: 0,
      operacion: {  }
    };
    this.valoresObjetos('todos');

    // this.remoteProvider = new CustomFileSystemProvider({
    //   getItems: this.getItems.bind(this),
    //   getItemsContent: this.downloadItems.bind(this)
    // });
    this.remoteProvider = new CustomFileSystemProvider({
      getItems: async (parentDirectory) => {
        const args = {
          pathInfo: this.getPathInfoArray(parentDirectory)
        };
        // const response = await fetch(
        //   'https://apidiseno.colchonessunmoon.com//files?command=GetDirContents&arguments=' +
        //   // 'https://js.devexpress.com/Demos/NetCore/api/file-manager-file-system-images?command=GetDirContents&arguments=' +
        //   encodeURIComponent(JSON.stringify(args))
        // );
        const response = await fetch(
          this.endPoint +
          encodeURIComponent(JSON.stringify(args))
        );
        const data = await response.json();
        return data.result || [];
      },
      downloadItems: (items: any[]) => {
        items.forEach(file => {
          if (file.dataItem.url) {
            const a = document.createElement('a');
            a.href = file.dataItem.url;
            a.download = file.name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            console.warn('Archivo sin URL válida:', file);
          }
        });
      }
    });
  }

  ngOnDestroy() {}

  private getPathInfoArray(fileOrDir: any) {
    const pathInfo:any = [];
    let current = fileOrDir;

    while (current && current.key) {
      pathInfo.unshift({
        key: current.key,
        name: current.name
      });
      current = current.parentPath; // DevExtreme mantiene jerarquía en parentPath
    }

    return pathInfo;
  }


  // // Codifica el pathInfoList requerido por la API
  // private buildPathInfoArray(fileOrDir: any): any[] {
  //   const pathInfo: any[] = [];
  //   let current = fileOrDir;

  //   while (current && current.key) {
  //     pathInfo.unshift({
  //       key: current.key,
  //       name: current.name
  //     });
  //     current = current.parentPath; // DevExtreme conserva jerarquía aquí
  //   }

  //   return pathInfo;
  // }

  // private async getItems(parentDirectory: any): Promise<any[]> {
  //   const pathInfo = this.buildPathInfoArray(parentDirectory);
  //   const args = {
  //     pathInfo
  //   };

  //   const headers = new Headers();
  //   headers.set(
  //     'Authorization',
  //     'Basic ' + btoa(`${this.userSistem}:${this.passSistem}`)
  //   );

  //   const url =
  //     this.endPoint +
  //     encodeURIComponent(JSON.stringify(args));

  //   const response = await fetch(url, { headers });
  //   const data = await response.json();

  //   return data.result || [];
  // }

  // private downloadItems(items: any[]): void {
  //   items.forEach((item) => {
  //     const pathInfoList = [this.buildPathInfoArray(item)];

  //     const downloadArgs = encodeURIComponent(
  //       JSON.stringify({ pathInfoList })
  //     );

  //     const downloadUrl = `${this.endPoint}${downloadArgs}`;

  //     const a = document.createElement('a');
  //     a.href = downloadUrl;
  //     a.download = item.name;
  //     a.target = '_blank';

  //     // Autenticación básica
  //     const headers = 'Basic ' + btoa(`${this.userSistem}:${this.passSistem}`);

  //     // Enlace no puede enviar headers, así que delegamos a nueva ventana
  //     const win = window.open(downloadUrl, '_blank');
  //     if (win) {
  //       win.focus();
  //     } else {
  //       alert('El navegador bloqueó la descarga');
  //     }
  //   });
  // }

















  valoresObjetos(obj:string) {
    if (obj === 'permisos usuario' || obj === 'todos'){
      const prm:any = {};
      this._sbarreg.carguemenu(this.prmUsrAplBarReg).subscribe((data) => {
        const res = JSON.parse(data.data);
        if ( (data.token != undefined) ){
          const refreshToken = data.token;
          localStorage.setItem("token", refreshToken);
        }
        this.PermisosUsuario = {
          create: res.r_nuevo,
          copy: res.r_modificar,
          move: res.r_modificar,
          delete: res.r_eliminar,
          rename: res.r_nuevo,
          upload: res.r_modificar,
          download: res.r_imprimir
        };
        
      });
    };
  }

  showModal(mensaje: any, title: any) {
    const tipo = title;
    Swal.fire({
      iconHtml: "<i class='icon-cancelar-ol error-color'></i>",
      confirmButtonColor: tipo==='Error' ? 'DF3E3E':'#0F4C81 !important',
      title: title,
      text: mensaje,
      allowOutsideClick: true,
      allowEscapeKey: false,
      allowEnterKey: false,
      backdrop: true,
      position: 'center',
      stopKeydownPropagation: false,
    });
  }

}
