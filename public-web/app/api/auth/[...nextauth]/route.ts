import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          scope: 'openid email profile'
        }
      }
    }),
    
    // Credenciales locales
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
          // Llamar al backend para autenticar
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email: credentials.email,
            password: credentials.password
          });

          if (response.data.success && response.data.data.usuario) {
            return {
              id: response.data.data.usuario.id,
              email: response.data.data.usuario.email,
              name: response.data.data.usuario.nombre,
              role: response.data.data.usuario.rol,
              token: response.data.data.token
            };
          }

          return null;
        } catch (error: any) {
          console.error('Error al autenticar:', error.response?.data?.message || error.message);
          throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Guardar info del usuario en el token
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USUARIO';
        token.accessToken = (user as any).token;
      }

      // Si es login con Google, crear o actualizar usuario en backend
      if (account?.provider === 'google' && user) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/google`, {
            email: user.email,
            nombre: user.name,
            foto_perfil: user.image,
            provider: 'google'
          });

          if (response.data.success) {
            token.id = response.data.data.usuario.id;
            token.role = response.data.data.usuario.rol;
            token.accessToken = response.data.data.token;
          }
        } catch (error) {
          console.error('Error al registrar usuario de Google:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Pasar info del token a la sesión
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
