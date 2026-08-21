import * as Model from 'devexpress-dashboard/model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import SelectBox from "devextreme/ui/select_box";
import Button from "devextreme/ui/button";
import Swal from 'sweetalert2';
import { showToast } from 'src/app/shared/toast/toastComponent.js';

// ============================================
// 1. REGISTRAR PROPIEDAD PERSONALIZADA
// ============================================
const kpiProperty: Model.CustomPropertyMetadata = {
    ownerType: Model.CardItem,
    propertyName: "aplicationCode",
    defaultValue: "",
    valueType: "string"
};

Model.registerCustomProperty(kpiProperty);

// ============================================
// CLASE DE LA EXTENSIÓN
// ============================================
export class CardSetKpiExtension {
    public name = "CardSetKpiExtension";
    private viewerApi: any;
    private popupElement: HTMLElement | null = null;
    private sData: DashboardService;
    private comboOptions: { value: string, text: string }[] = [];
    private loadingOptions: boolean = false;
    constructor(private dashboardControl: any,  dashboardService: DashboardService) {
        this.sData = dashboardService; 
        (window as any).__dashboardControl = this.dashboardControl;
        (window as any).__cardExtension = this;
    }

    start() {
        // Cargar Stilos
        this.addStyles();

        // Cargar opciones al iniciar
        this.loadOptions();
        
        this.viewerApi = this.dashboardControl.findExtension("viewer-api");        
        if (this.viewerApi) {
            this.viewerApi.on("itemCaptionToolbarUpdated", (args: any) => {
                this.onItemCaptionToolbarUpdated(args);
            });            
        } else {
            console.warn("⚠️ Extensión 'viewer-api' no encontrada");
        }
    }

    stop() {
        if (this.viewerApi) {
            this.viewerApi.off("itemCaptionToolbarUpdated");            
        }
        this.closePopup();
    }

    // ============================================
    // CARGAR OPCIONES DESDE EL SERVICIO
    // ============================================
    private loadOptions() {
        this.loadingOptions = true;
        this.sData
            .consulta('KpiList', {}, 'dashboard-data')
            .subscribe({
                next: (data: any) => {
                    try {
                        const res = JSON.parse(data.data);
                        if (data.token != undefined) {
                            const refreshToken = data.token;
                            localStorage.setItem('token', refreshToken);
                        }
                        if (res[0] && res[0].ErrMensaje && res[0].ErrMensaje !== '') {
                            console.error("❌ Error desde el servicio:", res[0].ErrMensaje);
                            this.comboOptions = [];
                            this.loadingOptions = false;
                            return;
                        }

                        // ============================================
                        // EXTRAER DATOS DE LA RESPUESTA
                        // ============================================
                        const datosString = res;                           
                        const datosArray = typeof res === "string" ? JSON.parse(res) : res;
                        if (!Array.isArray(datosArray) || datosArray.length === 0) {
                            console.warn("⚠️ No hay datos disponibles");
                            this.comboOptions = [];
                            this.loadingOptions = false;
                            return;
                        }

                        // ============================================
                        // CONSTRUIR OPCIONES: value = ID_APLICACION, text = NOMBRE
                        // ============================================
                        this.comboOptions = datosArray
                            .filter((item: any) => item.NOMBRE && item.NOMBRE.trim() !== '')
                            .map((item: any) => ({
                                value: String(item.ID_APLICACION),
                                text: item.NOMBRE.trim()
                            }));
                        this.loadingOptions = false;

                    } catch (error) {
                        console.error("❌ Error al procesar la respuesta:", error);
                        this.comboOptions = [];
                        this.loadingOptions = false;
                    }
                },
                error: (error: any) => {
                    console.error("❌ Error en la consulta:", error);
                    this.comboOptions = [];
                    this.loadingOptions = false;
                }
            });
    }

    // ============================================
    // MANEJADOR DEL EVENTO
    // ============================================
    private onItemCaptionToolbarUpdated(args: any) {
        try {
            const itemName = args.itemName;
            const options = args.options;
            
            if (!itemName || !options) return;

            const dashboard = this.dashboardControl.dashboard();
            if (!dashboard) return;

            const items = dashboard.items();
            let targetItem = null;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].componentName() === itemName) {
                    targetItem = items[i];
                    break;
                }
            }

            if (!targetItem) return;

            const isCard = this.isCardItem(targetItem);
            
            if (isCard) {
                const hasButton = options.actionItems.some((item: any) => 
                    item.hint === "Configurar KPI Asociado"
                );

                if (!hasButton) {
                    options.actionItems.push({
                        type: "button",
                        icon: "iconKpiSettings",
                        hint: "Configurar KPI Asociado",
                        click: () => {
                            this.openPopup(itemName);
                        }
                    });
                }               
            }
        } catch (error) {
            console.error("❌ Error en onItemCaptionToolbarUpdated:", error);
        }
    }

    // ============================================
    // 5. VERIFICAR SI ES UNA CARD
    // ============================================
    private isCardItem(item: any): boolean {
        try {
            if (item.itemType && typeof item.itemType === 'function') {
                const type = item.itemType();
                if (type === 'card' || type === 'Card') return true;
            }

            if (item.type === 'card' || item.type === 'Card') return true;
            if (item.dashboardItemType === 'Card') return true;

            if (item.constructor && item.constructor.name === 'CardItem') return true;

            return false;
        } catch (error) {
            return false;
        }
    }

    // ============================================
    // OBTENER VALOR DEL KPI ASOCIADO
    // ============================================
    private getAplicationCode(item: any): string {
        try {

            if (
                item?.customProperties &&
                typeof item.customProperties.aplicationCode === "function"
            ) {
                return item.customProperties.aplicationCode() || "";
            }
            return "";
        } catch (error) {
            console.error("Error al obtener el KPI:", error);
            return "";
        }
    }

    // ============================================
    // GUARDAR VALOR DEL KPI
    // ============================================
    private SetAplicationCode(item: any, value: string): boolean {
        try {

            if (
                item?.customProperties &&
                typeof item.customProperties.aplicationCode === "function"
            ) {
                item.customProperties.aplicationCode(value);
                return true;
            }
            console.error("La propiedad personalizada 'aplicationCode' no existe.");
            return false;

        } catch (error) {
            console.error("Error al asignar el KPI:", error);
            return false;
        }
    }

    // ============================================
    // 8. CERRAR POPUP
    // ============================================
    private closePopup() {
        if (this.popupElement) {
            this.popupElement.remove();
            this.popupElement = null;
        }
    }

    // ============================================
    // ABRIR POPUP CON OPCIONES DEL SERVICIO
    // ============================================
    private openPopup(itemName: string) {
        try {
            // Si no hay opciones y no está cargando, cargar
            if (this.comboOptions.length === 0 && !this.loadingOptions) {
                this.loadOptions();
            }
            this.closePopup();

            const dashboard = this.dashboardControl.dashboard();
            if (!dashboard) {
                console.error("❌ No se pudo obtener el dashboard");
                return;
            }

            const items = dashboard.items();
            let targetItem = null;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].componentName() === itemName) {
                    targetItem = items[i];
                    break;
                }
            }

            if (!targetItem) {
                console.error(`❌ No se encontró el item: ${itemName}`);
                return;
            }

            // Datos
            const valorActual = this.getAplicationCode(targetItem);
            const opciones = this.comboOptions;

            // Crear el contenedor del popup
            this.popupElement = document.createElement('div');
            this.popupElement.id = 'popup-setkpi-container';
            this.popupElement.style.position = 'fixed';
            this.popupElement.style.top = '0';
            this.popupElement.style.left = '0';
            this.popupElement.style.width = '100%';
            this.popupElement.style.height = '100%';
            this.popupElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            this.popupElement.style.display = 'flex';
            this.popupElement.style.justifyContent = 'center';
            this.popupElement.style.alignItems = 'center';
            this.popupElement.style.zIndex = '9999';

            const popupContent = document.createElement('div');
            popupContent.style.backgroundColor = 'white';
            popupContent.style.borderRadius = '8px';
            popupContent.style.padding = '30px';
            popupContent.style.width = '420px';
            popupContent.style.maxWidth = '90%';
            popupContent.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';

            // Título
            const title = document.createElement('h3');
            title.textContent = 'Configurar KPI Asociado';
            title.style.margin = '0 0 20px 0';
            title.style.color = '#333';
            title.style.fontSize = '18px';
            popupContent.appendChild(title);                       
            
            // ============================================
            // COMBO + BOTÓN RECARGAR
            // ============================================
            const selectRow = document.createElement("div");
            selectRow.style.display = "flex";
            selectRow.style.alignItems = "center";
            selectRow.style.gap = "8px";
            selectRow.style.marginBottom = "20px";
            selectRow.style.width = "100%";

            // ---------- Contenedor del combo ----------
            const comboContainer = document.createElement("div");
            comboContainer.style.flex = "1";
            comboContainer.style.minWidth = "0";

            const selectElement = document.createElement("div");
            comboContainer.appendChild(selectElement);

            selectRow.appendChild(comboContainer);

            // ---------- Botón Recargar ----------
            const reloadBtn = document.createElement("button");
            reloadBtn.innerHTML = "🔄";
            reloadBtn.title = "Recargar KPIs";
            reloadBtn.style.width = "35px";
            reloadBtn.style.height = "30px";
            reloadBtn.style.border = "1px solid #ccc";
            reloadBtn.style.borderRadius = "4px";
            reloadBtn.style.background = "#f8f9fa";
            reloadBtn.style.cursor = "pointer";
            reloadBtn.style.fontSize = "16px";
            reloadBtn.style.flexShrink = "0";
            reloadBtn.onclick = () => {
                reloadBtn.innerHTML = "⏳";
                reloadBtn.disabled = true;
                this.loadOptions();
                setTimeout(() => {
                    this.closePopup();
                    this.openPopup(itemName);
                }, 1000);
            };

            selectRow.appendChild(reloadBtn);

            // Agregar la fila completa al popup ANTES de crear el SelectBox
            popupContent.appendChild(selectRow);

            // Crear el SelectBox
            const selectBox = new SelectBox(selectElement, {
                dataSource: opciones,
                displayExpr: "text",
                valueExpr: "value",
                value: valorActual || null,
                placeholder: "Seleccione un KPI",
                searchEnabled: true,
                showClearButton: false,
                width: "100%",
                disabled: this.loadingOptions || opciones.length === 0,

                // Muy importante
                dropDownOptions: {
                    container: popupContent,
                    position: {
                        my: "left top",
                        at: "left bottom",
                        of: selectElement
                    },
                    wrapperAttr: {
                        class: "dashboard-select-popup"
                    }
                }
            });                        

            // ============================================
            // BOTONES DEVEXTREME
            // ============================================
            const buttonContainer = document.createElement("div");
            buttonContainer.style.display = "flex";
            buttonContainer.style.justifyContent = "flex-end";
            buttonContainer.style.gap = "10px";
            buttonContainer.style.marginTop = "20px";

            popupContent.appendChild(buttonContainer);

            // ---------- Botón Cancelar ----------
            const cancelElement = document.createElement("div");

            new Button(cancelElement, {
                text: "Cancelar",
                type: "normal",
                stylingMode: "outlined",
                onClick: () => {
                    this.closePopup();
                }
            });

            buttonContainer.appendChild(cancelElement);

            // ---------- Botón Guardar ----------
            const saveElement = document.createElement("div");

            new Button(saveElement, {
                text: "Guardar",
                 elementAttr: {
                    class: "btn-guardar-dashboard"
                },
                stylingMode: "contained",
                disabled: this.loadingOptions || opciones.length === 0,
                onClick: () => {

                    const selectedValue = selectBox.option("value");

                    if (selectedValue) {
                        this.save(itemName, selectedValue as string);
                        this.closePopup();
                    } else {
                        this.showModal("Por favor, selecciona un KPI","Advertencia","","warning");
                    }
                }
            });

            buttonContainer.appendChild(saveElement);

            // Agregar popup al DOM
            this.popupElement.appendChild(popupContent);
            document.body.appendChild(this.popupElement);
        } catch (error) {
            console.error("❌ Error al abrir popup:", error);
        }
    }

    // ============================================
    // GUARDAR ASIGNACION
    // ============================================
    public save(itemName: string, aplicationCode: string) {
        try {
            const dashboard = this.dashboardControl.dashboard();
            if (!dashboard) {
                console.error("❌ No se pudo obtener el dashboard");
                return;
            }

            const items = dashboard.items();
            let targetItem = null;
            
            for (let i = 0; i < items.length; i++) {
                if (items[i].componentName() === itemName) {
                    targetItem = items[i];
                    break;
                }
            }

            if (!targetItem) {
                console.error(`❌ No se encontró el item: ${itemName}`);
                return;
            }
            const success = this.SetAplicationCode(targetItem, aplicationCode);
            
            if (success) {  
                this.dashboardControl.saveDashboard();                                           
            } else {    
                showToast('No se pudo realizar la asignación.', 'error');            
            }

        } catch (error) {
            console.error("❌ Error al realizar la asignación:", error);          
            showToast('Error al realizar la asignación:' + error, 'error');              
        }
    }

    showModal(mensaje: any, 
            titulo: any = '¡Error!', 
            msg_html: any = '', 
            tipo: 'error' | 'warning' | 'success' | 'default' = 'default') {
    let iconHtml = '';
    switch (tipo) {
        case 'success':
            iconHtml = "<i class='icon-check-circle success-color'></i>";
            break;

        case 'warning':
            iconHtml = "<i class='icon-alert-ol warning-color'></i>";
            break;

        case 'error':
            iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
            break;

        default:
            iconHtml = "<i class='icon-cancelar-ol error-color'></i>";
            if (titulo !== '¡Error!') iconHtml = "<i class='icon-alert-ol'></i>";            
    }    
    Swal.fire({
        iconHtml: iconHtml,
        confirmButtonColor: '#0F4C81',
        title: titulo,
        text: mensaje,
        allowOutsideClick: true,
        allowEscapeKey: false,
        allowEnterKey: false,
        backdrop: true,
        position: 'center',
        html: msg_html,
        stopKeydownPropagation: false,
    });
    }

    private addStyles() {
        if (document.getElementById("dashboard-extension-styles")) {
            return;
        }
        const style = document.createElement("style");
        style.id = "dashboard-extension-styles";
        style.textContent = `
            .dashboard-select-popup {
                z-index: 20000 !important;
            }
            .btn-guardar-dashboard.dx-button {
                background-color: #0F4C81 !important;
                border-color: #0F4C81 !important;
                color: white !important;
            }
        `;
        document.head.appendChild(style);
    }
}