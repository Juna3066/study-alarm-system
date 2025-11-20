export interface RingtoneType {
  id: string;
  name: string;
  fileName: string;
  fileBlob?: Blob; // Not stored in localStorage directly, handled via IndexedDB
  remarks: string;
}

export interface BellSchedule {
  id: string;
  time: string; // Format "HH:mm"
  name: string;
  typeId: string; // Links to RingtoneType.id
}

export interface AppData {
  ringtones: RingtoneType[];
  schedule: BellSchedule[];
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  RINGTONES = 'RINGTONES',
  SCHEDULE = 'SCHEDULE',
}