import DxForm from 'devextreme/ui/form';
import * as Dashboard from 'devexpress-dashboard';
import * as Model from 'devexpress-dashboard/model';
import * as Designer from 'devexpress-dashboard/designer';
var enabledProperty: Model.CustomPropertyMetadata = {
    ownerType: Model.DashboardItem,
    propertyName: "descriptionEnabled",
    defaultValue: false,
    valueType: 'boolean'
};
var textProperty: Model.CustomPropertyMetadata = {
    ownerType: Model.DashboardItem,
    propertyName: "description",
    defaultValue: "",
    valueType: 'string'
};
var displayModeProperty: Model.CustomPropertyMetadata = {
    ownerType: Model.DashboardItem,
    propertyName: "descriptionDisplayMode",
    defaultValue: 'Always',
    valueType: 'string'
};
Model.registerCustomProperty(enabledProperty);
Model.registerCustomProperty(displayModeProperty);
Model.registerCustomProperty(textProperty);
function onItemCaptionToolbarUpdated(args: Dashboard.ItemCaptionToolbarUpdatedEventArgs) {
    var descriptionVisible = args.dashboardItem.customProperties.getValue(enabledProperty.propertyName);
    if (descriptionVisible) {
        var description = args.dashboardItem.customProperties.getValue(textProperty.propertyName);
        var displayMode = args.dashboardItem.customProperties.getValue(displayModeProperty.propertyName);
        var array = displayMode === 'OnHover' ? args.options.actionItems : args.options.stateItems;
        array.push({
            type: "button",
            icon: "iconDescription",
            tooltip: !!description ? description.toString() : undefined
        });
    }
}
;
function isDescriptionDisabled(dashboardItem: Model.DashboardItem) {
    return !dashboardItem.customProperties.getValue(enabledProperty.propertyName);
}
function changeDisabledState(dxForm: DxForm, fieldName: string, isDisabled: boolean) {
    let itemOptions = dxForm.itemOption(fieldName);
    if (itemOptions) {
        let editorOptions = itemOptions.editorOptions || {};
        editorOptions.disabled = isDisabled;
        dxForm.itemOption(fieldName, "editorOptions", editorOptions);
    }
}
function onCustomizeSections(args: Designer.CustomizeSectionsEventArgs) {
    args.addSection({
        title: "Description (Custom)",
        onFieldDataChanged: function (e) {
            if (!e.component) return;
 e.component.beginUpdate();
            changeDisabledState(e.component, textProperty.propertyName, isDescriptionDisabled(args.dashboardItem));
            changeDisabledState(e.component, displayModeProperty.propertyName, isDescriptionDisabled(args.dashboardItem));
            e.component.endUpdate();
        },
        items: [
            {
                dataField: enabledProperty.propertyName,
                label: {
                    text: "Visible"
                },
                template: Designer.FormItemTemplates.buttonGroup,
                editorOptions: {
                    keyExpr: "value",
                    items: [{
                            value: true,
                            text: "Visible"
                        }, {
                            value: false,
                            text: "Hidden"
                        }]
                }
            },
            {
                dataField: displayModeProperty.propertyName,
                label: {
                    text: "Display Mode"
                },
                template: Designer.FormItemTemplates.buttonGroup,
                editorOptions: {
                    keyExpr: "value",
                    items: [{
                            value: "OnHover",
                            text: "On hover"
                        }, {
                            value: "Always",
                            text: "Always"
                        }],
                    disabled: isDescriptionDisabled(args.dashboardItem)
                }
            },
            {
                dataField: textProperty.propertyName,
                editorType: "dxTextArea",
                label: {
                    text: "Description"
                },
                editorOptions: {
                    height: 90,
                    disabled: isDescriptionDisabled(args.dashboardItem)
                }
            }
        ]
    });
}
;
export class ItemDescriptionExtension {
    name = "ItemDescription";
    constructor(private dashboardControl: Dashboard.DashboardControl) {
    }
    start() {
        var viewerApiExtension = <Dashboard.ViewerApiExtension>this.dashboardControl.findExtension('viewer-api');
        if (viewerApiExtension) {
            viewerApiExtension.on('itemCaptionToolbarUpdated', onItemCaptionToolbarUpdated);
        }
        var optionsPanelExtension = <Designer.OptionsPanelExtension>this.dashboardControl.findExtension("item-options-panel");
        if (optionsPanelExtension) {
            optionsPanelExtension.on('customizeSections', onCustomizeSections);
        }
    }
    ;
    stop() {
        var viewerApiExtension = <Dashboard.ViewerApiExtension>this.dashboardControl.findExtension('viewer-api');
        if (viewerApiExtension) {
            viewerApiExtension.off('itemCaptionToolbarUpdated', onItemCaptionToolbarUpdated);
        }
        var optionsPanelExtension = <Designer.OptionsPanelExtension>this.dashboardControl.findExtension("item-options-panel");
        if (optionsPanelExtension) {
            optionsPanelExtension.off('customizeSections', onCustomizeSections);
        }
    }
    ;
}
