import * as Dashboard from 'devexpress-dashboard';
import * as Model from 'devexpress-dashboard/model';
import * as Designer from 'devexpress-dashboard/designer';
import { format } from 'devexpress-dashboard/data/_formatter';
import { formatNumber } from '@angular/common';

// 1. Model
const dashStyleProperty: Model.CustomPropertyMetadata = {
    ownerType: Model.SimpleSeries,
    propertyName: "DashStyleProperty",
    defaultValue: "solid",
    valueType: 'string'
};

Model.registerCustomProperty(dashStyleProperty);

// 2. Viewer
function onItemWidgetOptionsPrepared(args) {
    if (args.dashboardItem instanceof Model.ChartItem) {
        var seriesOptionArray = args.options['series'] || [];
        seriesOptionArray.forEach(function(seriesOption) {
            if (seriesOption.type === "line") {
                var series = args.chartContext.getDashboardItemSeries(seriesOption);
                if (series) {
                    var dashStyle = series.customProperties.getValue(dashStyleProperty.propertyName);
                    seriesOption.dashStyle = dashStyle;
                }
            }
        });
    }

    // if( args.itemName === 'chartDashboardItem5') {
    if( args.dashboardItem.itemType() === 'Chart' || args.dashboardItem.itemType() === 'Pie') {
        
        var baseChart = args.options.tooltip.customizeTooltip;
        args.options.tooltip = 
        {
            ...args.options.tooltip,
            customizeTooltip: function (arg) {
                var tool = baseChart(arg);
                const domParser = new DOMParser();
                const target = domParser.parseFromString(tool.html, 'text/html');
                const argx = target.getElementsByClassName('dx-argument-value');
                var xargument = "";
                if (argx.length > 0)
                    xargument = argx[0].textContent??'';
                else
                    xargument = "";
                if (args.dashboardItem.itemType() === 'Pie')
                   xargument = tool.text;
                
                //Something like this
                //var argument = this.point.tag.axisPoint.GetDimensionValue().GetDisplayText(); 
                if (args.dashboardItem.itemType() !== 'Pie')
                    return {
                        html: 
                        `<div class='xt-tooltips'><small class='xt-text-sm-l-muted'>` + (xargument == "" ? "Sin serie" :xargument) + `, &nbsp` + arg.seriesName 
                        + `</small><br/>` + formatNumber(Number(arg.valueText), 'en-US', '1.0-0') + `</div>`
                    };
                else
                    return {
                        html: 
                        `<div class='xt-tooltips'><small class='xt-text-sm-l-muted'>` + (xargument == "" ? "Sin serie" :xargument) + `&nbsp</small><br/></div>`
                    };
            }
        };
    }
};

// 3. Designer
function onCustomizeSections(args) {
    var simpleSeries = args.dataItemContainer;
    if (simpleSeries instanceof Model.SimpleSeries
        && ['Line', 'FullStackedLine', 'StackedLine', 'StepLine', 'Spline'].indexOf(simpleSeries.seriesType()) !== -1
    ) {
        args.addSection({
            title: "Line Options (Custom)",
            items: [
                {
                    dataField: dashStyleProperty.propertyName,
                    editorType: "dxSelectBox",
                    label: {
                        text: 'Dash style'
                    },
                    editorOptions: {
                        items: [
                            { value: 'dash', displayValue: "Dashes" },
                            { value: 'dot', displayValue: "Dots" },
                            { value: 'longDash', displayValue: "Long Dashes" },
                            { value: 'solid', displayValue: "Solid Line" },
                            { value: 'dashdot', displayValue: "Dash-Dots" }
                        ],
                        displayExpr: "displayValue",
                        valueExpr: "value"
                    }
                }
            ]
        });
    }
};

// 4. Event Subscription
export class ChartLineOptionsExtension {
    name = 'ChartLineOptions'

    constructor(private dashboardControl: Dashboard.DashboardControl) {
    }

    start() {
        let viewerApiExtension = <Dashboard.ViewerApiExtension>this.dashboardControl.findExtension('viewer-api');
        if (viewerApiExtension) {
            viewerApiExtension.on('itemWidgetOptionsPrepared', onItemWidgetOptionsPrepared);
        }
        let bindingPanelExtension = <Designer.BindingPanelExtension>this.dashboardControl.findExtension("item-binding-panel");
        if (bindingPanelExtension) {
            bindingPanelExtension.on('customizeDataItemContainerSections', onCustomizeSections);
        }
    }
    stop() {
        let viewerApiExtension = <Dashboard.ViewerApiExtension>this.dashboardControl.findExtension('viewer-api');
        if (viewerApiExtension) {
            viewerApiExtension.off('itemWidgetOptionsPrepared', onItemWidgetOptionsPrepared);
        }
        let bindingPanelExtension = <Designer.BindingPanelExtension>this.dashboardControl.findExtension("item-binding-panel");
        if (bindingPanelExtension) {
            bindingPanelExtension.off('customizeDataItemContainerSections', onCustomizeSections);
        }
    }
}

