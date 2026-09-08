import {
  AfterViewInit, ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy,
  SimpleChanges, ViewChild, ViewContainerRef, signal
} from '@angular/core';
import { findMcomApplication } from '../applications/mcom-application.registry';

/** Native Federation entry point consumed by the existing Shell workspace host. */
@Component({
  selector: 'xtein-mcom-application-host',
  standalone: true,
  imports: [],
  templateUrl: './application-host.component.html',
  styleUrl: './application-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplicationHostComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() applicationId = '';
  @ViewChild('applicationContainer', { read: ViewContainerRef, static: true })
  private applicationContainer!: ViewContainerRef;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  private viewInitialized = false;
  private loadedApplicationId: string | null = null;
  private loadVersion = 0;

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    void this.loadRequestedApplication();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['applicationId'] && this.viewInitialized) void this.loadRequestedApplication();
  }

  ngOnDestroy(): void {
    ++this.loadVersion;
    this.viewInitialized = false;
  }

  private async loadRequestedApplication(): Promise<void> {
    const applicationId = this.applicationId?.trim().toUpperCase();
    const version = ++this.loadVersion;
    this.errorMessage.set(null);
    this.loading.set(false);
    if (applicationId && applicationId === this.loadedApplicationId) return;
    this.applicationContainer.clear();
    this.loadedApplicationId = null;
    if (!applicationId) return;

    const registration = findMcomApplication(applicationId);
    if (!registration) {
      this.errorMessage.set('La aplicación ' + applicationId + ' aún no está disponible.');
      return;
    }

    this.loading.set(true);
    try {
      const application = await registration.load();
      if (version !== this.loadVersion || !this.viewInitialized) return;
      const component = this.applicationContainer.createComponent(application);
      this.loadedApplicationId = applicationId;
      component.changeDetectorRef.detectChanges();
    } catch (error) {
      if (version !== this.loadVersion || !this.viewInitialized) return;
      this.applicationContainer.clear();
      this.loadedApplicationId = null;
      this.errorMessage.set('No fue posible cargar la aplicación ' + applicationId + '.');
      console.error('XTEIN MCOM application resolution failed.', { applicationId, error });
    } finally {
      if (version === this.loadVersion && this.viewInitialized) this.loading.set(false);
    }
  }
}
