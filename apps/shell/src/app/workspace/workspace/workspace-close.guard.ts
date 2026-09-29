import type { WorkspaceRuntimeService } from '@xtein/runtime';
import Swal from 'sweetalert2';

/** Shared close policy for the tab strip and its overflow menu. */
export class WorkspaceCloseGuard {
  private confirming = false;

  constructor(private readonly workspace: Pick<WorkspaceRuntimeService, 'getTab' | 'closeApplication'>) {}

  async close(applicationId: string): Promise<boolean> {
    if (this.confirming) return false;
    const tab = this.workspace.getTab(applicationId);
    if (!tab?.closable) return false;
    if (!tab.dirty) return this.workspace.closeApplication(applicationId);

    this.confirming = true;
    try {
      const result = await Swal.fire({
        title: 'Cambios sin guardar',
        text: `«${tab.title}» tiene cambios sin guardar. ¿Desea cerrar la aplicación y descartarlos?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Cerrar sin guardar',
        cancelButtonText: 'Seguir editando',
        confirmButtonColor: '#DF3E3E',
        cancelButtonColor: '#0F4C81',
        focusConfirm: false,
        focusCancel: true,
        allowOutsideClick: false
      });
      // Never discard a replaced/reopened tab or changes made while the dialog was open.
      if (!result.isConfirmed || this.workspace.getTab(applicationId) !== tab) return false;
      return this.workspace.closeApplication(applicationId, true);
    } finally {
      this.confirming = false;
    }
  }
}
