import { DashboardControl, DashboardTitleToolbarUpdatedEventArgs, IExtension, ViewerApiExtension } from 'devexpress-dashboard';

/** Adds the backend data timestamp to the left of the viewer title. */
export class DashboardLastUpdatedExtension implements IExtension {
  readonly name = 'xtein-dashboard-last-updated';
  constructor(private readonly control: DashboardControl, private readonly value: string) {}
  private readonly update = (args: DashboardTitleToolbarUpdatedEventArgs): void => {
    if (!this.value) return;
    const text = `Ultima Actualización: ${this.value}`;
    args.options.navigationItems.push({ name: this.name, type: 'text', text,
      template: () => {
        const label = document.createElement('span');
        label.textContent = text;
        label.style.fontSize = '11px';
        label.style.fontWeight = '400';
        return label;
      } });
  };
  start(): void {
    (this.control.findExtension('viewer-api') as ViewerApiExtension | undefined)?.on('dashboardTitleToolbarUpdated', this.update);
  }
  stop(): void {
    (this.control.findExtension('viewer-api') as ViewerApiExtension | undefined)?.off('dashboardTitleToolbarUpdated', this.update);
  }
}
