import { storage } from '../config/firebase.js';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export const storageService = {
  async uploadPdfToFirebase(buffer: Buffer, destinationPath: string): Promise<string> {
    try {
      const storageRef = ref(storage, destinationPath);

      // Usar uploadBytesResumable igual que en createQuotePDF
      const uploadTask = await uploadBytesResumable(storageRef, buffer, {
        contentType: 'application/pdf',
      });

      // Obtener la URL pública de descarga
      const publicUrl = await getDownloadURL(uploadTask.ref);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading PDF to Firebase Storage:", error);
      throw new Error("Failed to upload PDF");
    }
  }
};
