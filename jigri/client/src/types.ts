export interface Language {
  id: string;
  name: string;
  monacoId: string;
  extension: string;
  type: 'compiled' | 'interpreted' | 'web' | 'data';
  defaultCode: string;
}