import Swal from 'sweetalert2';
import { Adm015ApplicationPermissionsState } from './adm-015-application-permissions.state';
import { Adm015AutorizacionRecord } from '../models/adm-015.model';

vi.mock('sweetalert2', () => ({ default: { fire: vi.fn() } }));

describe('ADM-015 application permissions', () => {
  let component: Adm015ApplicationPermissionsState;
  const warning = vi.fn();
  const row = (id: string): Adm015AutorizacionRecord => ({ ID_APLICACION: id,
    NOMBRE: id, CREAR: false, MODIFICAR: false, ELIMINAR: false, BUSCAR: false, LISTAR: false });
  beforeEach(() => {
    vi.clearAllMocks();
    component = new Adm015ApplicationPermissionsState({ warning } as never);
    component.readOnly = false;
    component.availableApps = [
      { ID_APLICACION: 'ADM-001', NOMBRE: 'Aplicaciones' },
      { ID_APLICACION: 'ADM-002', NOMBRE: 'Unidades de negocio' }
    ];
    component.synchronizeInputs();
  });

  it('requires a valid application, confirms a draft, and rejects duplicates', () => {
    component.begin(); component.commit();
    expect(warning).toHaveBeenCalled();
    expect(component.autorizaciones).toEqual([]);
    component.chooseApplication('ADM-001'); component.commit();
    expect(component.autorizaciones[0]).toMatchObject({ ID_APLICACION: 'ADM-001', NOMBRE: 'Aplicaciones', isEdit: true, LISTAR: false });
    expect(component.draft).toBeNull();
    component.begin(); component.chooseApplication('ADM-001'); component.commit();
    expect(component.autorizaciones).toHaveLength(1);
  });

  it('cancels a draft without emitting changes to confirmed authorizations', () => {
    const changed = vi.fn(); component.autorizacionesChange.subscribe(changed);
    component.begin(); component.chooseApplication('ADM-002'); component.setDraft(null);
    expect(component.autorizaciones).toEqual([]); expect(changed).not.toHaveBeenCalled();
  });

  it('changes an existing application only on confirmation and strips draft metadata', () => {
    component.autorizaciones = [{ ...row('ADM-001'), ITEM: 7, CREAR: true }]; component.synchronizeInputs();
    component.beginEdit(component.autorizaciones[0]); component.chooseApplication('ADM-002');
    expect(component.rows).toHaveLength(1);
    expect(component.autorizaciones[0].ID_APLICACION).toBe('ADM-001');
    component.commit();
    expect(component.autorizaciones[0]).toMatchObject({ ITEM: 7, ID_APLICACION: 'ADM-002', CREAR: true });
    expect(component.autorizaciones[0]).not.toHaveProperty('originalApplicationId');
  });

  it('restores the original row when editing an application is cancelled', () => {
    component.autorizaciones = [row('ADM-001')]; component.synchronizeInputs();
    component.beginEdit(component.autorizaciones[0]); component.chooseApplication('ADM-002'); component.setDraft(null);
    expect(component.rows.map(item => item.ID_APLICACION)).toEqual(['ADM-001']);
  });

  it('updates permissions immutably and preserves hidden backend fields', () => {
    const original = { ...row('ADM-001'), S_CLAVE: 'existing', EXCLUSIVA: true };
    component.autorizaciones = [original]; component.synchronizeInputs();
    component.changePermission(original, 'S_BUSCAR', true);
    expect(original.S_BUSCAR).toBeUndefined();
    expect(component.autorizaciones[0]).toMatchObject({ S_BUSCAR: true, S_CLAVE: 'existing', EXCLUSIVA: true, isEdit: true });
  });

  it('rejects conflicting individual and bulk permissions in both directions', () => {
    component.autorizaciones = [{ ...row('ADM-001'), S_BUSCAR: true }, row('ADM-002')]; component.synchronizeInputs();
    component.changePermission(component.autorizaciones[0], 'A_BUSCAR', true);
    expect(component.autorizaciones[0].A_BUSCAR).toBeUndefined();
    component.markAllColumn('A_BUSCAR', true);
    expect(component.autorizaciones.every(r => !r.A_BUSCAR)).toBe(true);
    component.markAllColumn('S_BUSCAR', false);
    component.markAllColumn('A_BUSCAR', true);
    component.changePermission(component.autorizaciones[1], 'S_BUSCAR', true);
    expect(component.autorizaciones[1].S_BUSCAR).toBe(false);
  });

  it('bulk selection applies operations only to selected choices and assigns unique item numbers', () => {
    component.openList(true); component.choiceKeys = ['ADM-002'];
    component.markChoices('CREAR', true);
    expect(component.choices[0].CREAR).toBe(false);
    component.choiceKeys = ['ADM-001', 'ADM-002']; component.acceptList();
    expect(component.autorizaciones.map(r => r.ITEM)).toEqual([1, 2]);
    expect(component.autorizaciones.map(r => r.CREAR)).toEqual([false, true]);
    component.openList(true); expect(component.choices).toEqual([]);
  });

  it('cancels the list without altering assigned permissions', () => {
    component.openList(true); component.choiceKeys = ['ADM-001']; component.markChoices('CREAR', true);
    component.openList(false); expect(component.autorizaciones).toEqual([]);
  });

  it('deletes only selected applications after confirmation, even without ITEM values', async () => {
    component.autorizaciones = [row('ADM-001'), row('ADM-002')]; component.selected = ['ADM-001'];
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    await component.removeSelected(); expect(component.autorizaciones).toHaveLength(2);
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    await component.removeSelected();
    expect(component.autorizaciones.map(r => r.ID_APLICACION)).toEqual(['ADM-002']);
  });

  it('blocks mutations and removes toolbar/selection in read-only mode', () => {
    component.autorizaciones = [row('ADM-001')]; component.readOnly = true; component.synchronizeInputs();
    component.begin(); component.markAllColumn('CREAR', true); component.openList(true); component.acceptList();
    expect(component.draft).toBeNull(); expect(component.listOpened).toBe(false);
    expect(component.toolbarActions).toEqual([]); expect(component.autorizaciones[0].CREAR).toBe(false);
  });
});
