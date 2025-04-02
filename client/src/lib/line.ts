// LINE LIFF SDK integration
import { apiRequest } from './queryClient';

export async function initializeLINE(liffId: string) {
  try {
    const liff = await import('@line/liff');
    await liff.default.init({ liffId });
    return liff.default;
  } catch (error) {
    console.error('LIFF initialization failed:', error);
    return null;
  }
}

export interface LINEProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export async function getLINEProfile(liff: any): Promise<LINEProfile | null> {
  if (!liff || !liff.isLoggedIn()) {
    return null;
  }

  try {
    return await liff.getProfile();
  } catch (error) {
    console.error('Failed to get LINE profile:', error);
    return null;
  }
}

export async function registerWithLINE(liff: any, additionalData: {
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}) {
  if (!liff || !liff.isLoggedIn()) {
    throw new Error('You must login with LINE first');
  }

  try {
    // Get LINE profile
    const profile = await getLINEProfile(liff);
    if (!profile) {
      throw new Error('Could not get LINE profile');
    }
    
    // Create username from LINE display name (remove spaces and add timestamp)
    const username = `${profile.displayName.replace(/\s+/g, '')}${Date.now().toString().slice(-4)}`;
    
    // Register with the backend
    const response = await apiRequest('POST', '/api/auth/register-with-line', {
      username,
      fullName: profile.displayName,
      email: additionalData.email,
      phoneNumber: additionalData.phoneNumber || '',
      dateOfBirth: additionalData.dateOfBirth || '',
      lineUserId: profile.userId,
      lineDisplayName: profile.displayName,
      linePictureUrl: profile.pictureUrl || '',
      lineStatusMessage: profile.statusMessage || '',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('LINE registration failed:', error);
    throw error;
  }
}

export async function loginWithLINEAccount(liff: any) {
  if (!liff || !liff.isLoggedIn()) {
    throw new Error('You must login with LINE first');
  }
  
  try {
    // Get LINE profile
    const profile = await getLINEProfile(liff);
    if (!profile) {
      throw new Error('Could not get LINE profile');
    }
    
    // Login with the backend using LINE ID
    const response = await apiRequest('POST', '/api/auth/login-with-line', {
      lineUserId: profile.userId,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('LINE login failed:', error);
    throw error;
  }
}

export function isLINELoggedIn(liff: any) {
  return liff && liff.isLoggedIn();
}

export async function loginWithLINE(liff: any) {
  if (!liff) return;
  
  if (!liff.isLoggedIn()) {
    try {
      await liff.login();
    } catch (error) {
      console.error('LINE login failed:', error);
    }
  }
}

export function logoutFromLINE(liff: any) {
  if (!liff) return;
  
  if (liff.isLoggedIn()) {
    liff.logout();
  }
}

export function openLINEShareDialog(liff: any, text: string) {
  if (!liff) return;
  
  if (liff.isApiAvailable('shareTargetPicker')) {
    liff.shareTargetPicker([
      {
        type: 'text',
        text,
      },
    ]);
  }
}

export function getLINEAccessToken(liff: any) {
  if (!liff || !liff.isLoggedIn()) {
    return null;
  }
  
  return liff.getAccessToken();
}

export function sendLINEMessage(liff: any, message: string) {
  if (!liff) return;
  
  if (liff.isApiAvailable('sendMessages')) {
    liff.sendMessages([
      {
        type: 'text',
        text: message,
      },
    ]);
  }
}
