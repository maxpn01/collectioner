export type AuthUser = {
  id: string;
  username?: string;
  email?: string;
  fullname?: string | null;
  blocked?: boolean;
  isAdmin?: boolean;
};
