export type AdminUser = {
  id: string;
  username: string;
  email: string;
  fullname: string | null;
  blocked: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersPage = {
  page: AdminUser[];
  lastPage: number;
};
