export interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string | null;
  scanlationGroup: string | null;
  uploadDate: Date | null;
  language?: string;
}
