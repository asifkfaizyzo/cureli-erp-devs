// src/store/prescriptionRequestStore.ts
//
// Isolated store for the prescription request submission flow.
// Completely separate from prescriptionStore (which serves the cart checkout flow).
// Reset after successful submission.

import { create } from 'zustand';

export interface UploadedRequestFile {
  file_key:      string;
  original_name: string;
  mime_type:     string;
  file_size:     number;
  // Local preview URI — not sent to backend
  uri?:          string;
}

interface PrescriptionRequestStore {
  // Step 1 — uploaded files
  uploadedFiles:      UploadedRequestFile[];
  isUploading:        boolean;
  uploadError:        string | null;

  // Step 2 — location and pharmacy selection
  selectedAddressId:  string | null;
  selectedBranchIds:  string[];

  // Submission
  isSubmitting:       boolean;
  submitError:        string | null;

  // After submission — navigate to detail
  currentRequestId:   string | null;

  // Mutations
  addUploadedFile:    (file: UploadedRequestFile) => void;
  removeUploadedFile: (fileKey: string) => void;
  setUploading:       (v: boolean) => void;
  setUploadError:     (e: string | null) => void;

  setSelectedAddress: (id: string | null) => void;
  toggleBranch:       (branchId: string) => void;
  clearBranches:      () => void;

  setSubmitting:      (v: boolean) => void;
  setSubmitError:     (e: string | null) => void;
  setCurrentRequest:  (id: string | null) => void;

  reset:              () => void;
}

const initialState = {
  uploadedFiles:     [],
  isUploading:       false,
  uploadError:       null,
  selectedAddressId: null,
  selectedBranchIds: [],
  isSubmitting:      false,
  submitError:       null,
  currentRequestId:  null,
};

export const usePrescriptionRequestStore = create<PrescriptionRequestStore>()(
  (set) => ({
    ...initialState,

    addUploadedFile: (file) =>
      set((s) => ({
        uploadedFiles: [...s.uploadedFiles, file].slice(0, 5),
        uploadError:   null,
      })),

    removeUploadedFile: (fileKey) =>
      set((s) => ({
        uploadedFiles: s.uploadedFiles.filter((f) => f.file_key !== fileKey),
      })),

    setUploading:   (isUploading)   => set({ isUploading }),
    setUploadError: (uploadError)   => set({ uploadError }),

    setSelectedAddress: (selectedAddressId) => set({ selectedAddressId }),

    toggleBranch: (branchId) =>
      set((s) => {
        const exists = s.selectedBranchIds.includes(branchId);
        if (exists) {
          return { selectedBranchIds: s.selectedBranchIds.filter((id) => id !== branchId) };
        }
        // Max 10 branches
        if (s.selectedBranchIds.length >= 10) return s;
        return { selectedBranchIds: [...s.selectedBranchIds, branchId] };
      }),

    clearBranches: () => set({ selectedBranchIds: [] }),

    setSubmitting:     (isSubmitting)   => set({ isSubmitting }),
    setSubmitError:    (submitError)    => set({ submitError }),
    setCurrentRequest: (currentRequestId) => set({ currentRequestId }),

    reset: () => set(initialState),
  }),
);