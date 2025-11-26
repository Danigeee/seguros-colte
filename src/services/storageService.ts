import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

// Inicialización de Firebase Admin si no existe
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'firebase_test.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log("Firebase Admin initialized with service account.");
    } else {
      console.warn("Service account file not found at:", serviceAccountPath);
      // Fallback to default credentials if file is missing
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

export const storageService = {
  async uploadPdfToFirebase(buffer: Buffer, destinationPath: string): Promise<string> {
    try {
      const bucket = getStorage().bucket();
      const file = bucket.file(destinationPath);

      await file.save(buffer, {
        contentType: 'application/pdf',
        public: true, // Hacer el archivo público
      });

      // Opción A: Si el bucket es público o usamos public: true
      const publicUrl = file.publicUrl();
      
      // Opción B: Signed URL (si se prefiere seguridad)
      // const [url] = await file.getSignedUrl({
      //   action: 'read',
      //   expires: '03-01-2500',
      // });
      // return url;

      return publicUrl;
    } catch (error) {
      console.error("Error uploading PDF to Firebase:", error);
      throw new Error("Failed to upload PDF");
    }
  }
};
