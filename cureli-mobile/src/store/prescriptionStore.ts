// src/store/prescriptionStore.ts

import { create } from 'zustand';

export interface PrescriptionFile {
  prescription_key: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  uri?: string; // local preview URI — not sent to backend
}

const MAX_FILES = 5;

interface PrescriptionState {
  tempFiles: PrescriptionFile[];
  isUploading: boolean;
  uploadError: string | null;
  // Delivery instruction selections — transient, cleared with order
  deliveryNotes: string;

  addFiles: (files: PrescriptionFile[]) => void;
  removeFile: (prescriptionKey: string) => void;
  setUploading: (uploading: boolean) => void;
  setUploadError: (error: string | null) => void;
  setDeliveryNotes: (notes: string) => void;
  clearTempFiles: () => void;

  // Legacy
  setTempFiles: (files: PrescriptionFile[]) => void;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
  tempFiles: [],
  isUploading: false,
  uploadError: null,
  deliveryNotes: '',

  addFiles: (incoming) =>
    set((state) => ({
      tempFiles: [...state.tempFiles, ...incoming].slice(0, MAX_FILES),
      uploadError: null,
    })),

  removeFile: (prescriptionKey) =>
    set((state) => ({
      tempFiles: state.tempFiles.filter(
        (f) => f.prescription_key !== prescriptionKey,
      ),
    })),

  setUploading: (isUploading) => set({ isUploading }),

  setUploadError: (uploadError) => set({ uploadError }),

  // Cleared together with files after order placement
  setDeliveryNotes: (deliveryNotes) => set({ deliveryNotes }),

  clearTempFiles: () =>
    set({
      tempFiles: [],
      isUploading: false,
      uploadError: null,
      deliveryNotes: '',  // ← clear notes with order
    }),

  setTempFiles: (files) => set({ tempFiles: files }),
}));