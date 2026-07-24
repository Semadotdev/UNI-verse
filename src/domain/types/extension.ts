export interface InstalledProvider {
  packageName: string;
  providerId: string;
  name: string;
  version: string;
  lang: string;
  description: string | null;
  icon: string | null;
  nsfw: boolean;
  enabled: boolean;
  hasSearch: boolean;
  hasPopular: boolean;
  hasLatest: boolean;
}
