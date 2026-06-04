import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let adminApp: App

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]
  }
  // Use service account JSON if provided, otherwise fall back to
  // project ID + credentials from environment
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    adminApp = initializeApp({ credential: cert(serviceAccount) })
  } else {
    // Fallback: initialize with just the project ID
    // Works when GOOGLE_APPLICATION_CREDENTIALS env var is set,
    // or when running on Google Cloud infra
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  }
  return adminApp
}

export function getAdminDb() {
  return getFirestore(getAdminApp())
}
