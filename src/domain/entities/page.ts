export interface Page {
  index: number;
  url: string;
  headers?: Record<string, string>;
  direct?: boolean;
}
