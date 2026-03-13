import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth para administradores
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile'
        }
      }
    }),
    
    // Credenciales locales para administradores
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña son requeridos');
        }

        try {
          const response = await axios.post(`${API_URL}/api/admin/auth/login`, {
            email: credentials.email,
            password: credentials.password
          });

          if (response.data.success) {
            const user = response.data.data.user;
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.nombre,
              role: user.rol || 'ADMIN'
            };
          }
          return null;
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Error al autenticar');
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Registrar/autenticar administrador con Google
          const response = await axios.post(`${API_URL}/api/admin/auth/google`, {
            email: user.email,
            nombre: user.name,
            google_id: user.id,
            imagen_perfil: user.image
          });

          if (response.data.success) {
            // Actualizar el usuario con datos del backend
            user.role = 'ADMIN';
            user.id = response.data.data.user.id.toString();
            return true;
          }
        } catch (error) {
          console.error('Error en autenticación Google admin:', error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || 'ADMIN';
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },

  pages: {
    signIn: '/login',
    error: '/login'
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
