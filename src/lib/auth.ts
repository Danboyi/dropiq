import bcrypt from 'bcryptjs'
import { ethers } from 'ethers'
import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

export function createSignInMessage(nonce: string): string {
  return `Sign this message to authenticate with DROPIQ.\n\nNonce: ${nonce}\n\nThis does not cost any gas fees.`
}

export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature)
    
    // Compare case-insensitively (Ethereum addresses are case-insensitive)
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

export function isValidEthereumAddress(address: string): boolean {
  return ethers.isAddress(address)
}

export function normalizeAddress(address: string): string {
  return ethers.getAddress(address)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { wallets: true }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await verifyPassword(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isGuest: user.isGuest,
          wallets: user.wallets
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isGuest = user.isGuest
        if (account?.provider === 'credentials') {
          token.authMethod = 'email'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isGuest = token.isGuest as boolean
        session.user.authMethod = token.authMethod as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}