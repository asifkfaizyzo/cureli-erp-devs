import { create } from 'zustand';

interface PrescriptionFile {
  prescription_key: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  uri?: string; // local preview
}

interface PrescriptionState {
  tempFiles: PrescriptionFile[];
  setTempFiles: (files: PrescriptionFile[]) => void;
  clearTempFiles: () => void;
}

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
  tempFiles: [],
  setTempFiles: (files) => set({ tempFiles: files }),
  clearTempFiles: () => set({ tempFiles: [] }),
}));