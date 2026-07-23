// src/store/prescriptionRequestStore.ts
//
// Isolated store for the prescription request submission flow.
// Completely separate from prescriptionStore (which serves the cart checkout flow).
//
// Persisted via MMKV: uploadedFiles, selectedAddressId, selectedBranchIds, currentRequestId
// Not persisted (transient UI): isUploading, uploadError, isSubmitting, submitError

import { create }                       from 'zustand';
import { persist, createJSONStorage }   from 'zustand/middleware';
import { mmkvStorage }                  from '../lib/mmkvStorage';

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

  // After submission — used to detect an already-submitted request
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
  persist(
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
            return {
              selectedBranchIds: s.selectedBranchIds.filter((id) => id !== branchId),
            };
          }
          if (s.selectedBranchIds.length >= 10) return s;
          return { selectedBranchIds: [...s.selectedBranchIds, branchId] };
        }),

      clearBranches: () => set({ selectedBranchIds: [] }),

      setSubmitting:     (isSubmitting)     => set({ isSubmitting }),
      setSubmitError:    (submitError)      => set({ submitError }),
      setCurrentRequest: (currentRequestId) => set({ currentRequestId }),

      reset: () => set(initialState),
    }),
    {
      name:    'prescription-request-storage',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the draft data — never persist transient UI state
      partialize: (state) => ({
        uploadedFiles:     state.uploadedFiles,
        selectedAddressId: state.selectedAddressId,
        selectedBranchIds: state.selectedBranchIds,
        currentRequestId:  state.currentRequestId,
      }),
    },
  ),
);