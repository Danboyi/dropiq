import bcrypt from 'bcryptjs'
import { ethers } from 'ethers'

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