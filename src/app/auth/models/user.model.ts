export interface User {
  id: number;
  fullName: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  password?: string;
}

export interface DeleteAccountDto {
  password: string;
}
