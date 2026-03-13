import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: string;
    token?: string;
    isAdmin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      isAdmin?: boolean;
      accessToken?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    isAdmin?: boolean;
    accessToken?: string;
  }
}
