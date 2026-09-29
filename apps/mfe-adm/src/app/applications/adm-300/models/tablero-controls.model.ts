import type { assignees, priorities, populationData } from '../constants/tablero-demo.constants';
export interface TableroControlsContext {
 populationData: typeof populationData;
 assignees: typeof assignees;
 priorities: typeof priorities;
 currentDate: Date;
 customizeLabel: (event:{argumentText?:string;valueText?:string})=>string;
}
