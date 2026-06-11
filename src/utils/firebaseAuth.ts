import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request broad Drive scope to read spreadsheet files
provider.addScope('https://www.googleapis.com/auth/drive');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load or component mount.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain access token from Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Interface for Drive File representation
export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

// Search and list Google Sheets from authenticated Google Drive
export const searchDriveSheets = async (accessToken: string, queryText: string = ''): Promise<DriveFile[]> => {
  try {
    let q = "mimeType = 'application/vnd.google-apps.spreadsheet'";
    if (queryText.trim()) {
      const escapedQuery = queryText.replace(/'/g, "\\'");
      q += ` and name contains '${escapedQuery}'`;
    }
    
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=25`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Failed to fetch from Drive: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Error listing drive sheet files:', error);
    throw new Error(error.message || 'Error occurred while querying Google Drive.');
  }
};

// Fetch Google Sheet file contents as CSV string via Drive export API
export const getSpreadsheetAsCSV = async (accessToken: string, fileId: string): Promise<string> => {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Failed to download sheet from Drive: ${response.statusText}`);
    }

    return await response.text();
  } catch (error: any) {
    console.error('Error downloading spreadsheet contents:', error);
    throw new Error(error.message || 'Error occurred while downloading spreadsheet data.');
  }
};
