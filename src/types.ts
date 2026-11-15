export type AppView =
  | 'map'
  | 'dashboard'
  | 'shap'
  | 'patrol'
  | 'alerts'
  | 'config'
  | 'reports'
  | 'audit'
  | 'status';

export interface AuthUser {
  name: string;
  role: string;
  email: string;
  initials: string;
}
