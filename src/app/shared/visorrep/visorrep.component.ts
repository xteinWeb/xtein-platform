import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DxReportViewerModule } from 'devexpress-reporting-angular';

@Component({
    selector: 'app-visorrep',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './visorrep.component.html',
    styleUrls: ['./visorrep.component.css',
        "../../../../node_modules/jquery-ui/themes/base/all.css",
        "../../../../node_modules/devextreme/dist/css/dx.common.css",
        "../../../../node_modules/devexpress-richedit/dist/dx.richedit.css",
        "../../../../node_modules/@devexpress/analytics-core/dist/css/dx-analytics.common.css",
        "../../../../node_modules/@devexpress/analytics-core/dist/css/dx-analytics.light.css",
        "../../../../node_modules/@devexpress/analytics-core/dist/css/dx-querybuilder.css"],
    imports: [DxReportViewerModule]
})

export class VisorrepComponent implements OnInit {
  @Input() prm_rpt: any;
  navigation: any;
  elementAttr: any;

  constructor(private route: ActivatedRoute) { }

  title = 'DXReportDesignerSample';
  getDesignerModelAction = "ReportDesigner/GetReportDesignerModel";

  reportUrl: string = '';
  hostUrl: string = '';
  invokeAction: string = "";

  DocumentReady(e: any) {
  }
  CustomizeElements(e: any) {
    var sendViaEmailItem = {
      id: 'someCustomId',
      imageClassName: 'custom-image-item',
     // imageTemplateName
      text: 'Send via Email',
      visible: true,
      disabled: false,
      clickAction: () => {
        e.sender.PerformCustomDocumentOperation('some@email.com');
      }
    };
    e.args.Actions.push(sendViaEmailItem);
  }
  BeforeRenderRpt(e: any) {
    e.args.reportPreview.zoom(-1);
  }

  ngOnInit(): void {
    this.route.params.subscribe(parameter => {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const codePrm = urlParams.get('prm_rpt');
      var prm_safe = decodeURIComponent(codePrm?? '');

      this.prm_rpt.filtro = JSON.stringify(this.prm_rpt.filtro);
      this.reportUrl = this.prm_rpt.idrpt + '?clid=' + this.prm_rpt.clid + '&' + JSON.stringify(this.prm_rpt);
      // this.hostUrl = 'http://192.168.10.108:9300/';
      this.hostUrl = 'https://reportes.colchonessunmoon.com/';
      //this.hostUrl = 'http://localhost:8200/';
      console.log("reporte........", this.hostUrl);
      this.invokeAction = "DXXRDV";
    });

  }

}
