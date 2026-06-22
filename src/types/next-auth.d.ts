import { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      active: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: Role;
    active?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    active?: boolean;
  }
}
