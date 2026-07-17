// cureli-mobile/src/store/branchStatusStore.ts
// NEW FILE — same pattern as orderNotificationStore.ts

import { create } from 'zustand';

interface BranchStatusUpdate {
  branch_id:    string;
  is_open:      boolean;
  opening_time: string | null;
  closing_time: string | null;
  is_24_hours:  boolean;
}

interface BranchStatusStore {
  lastBranchUpdate: BranchStatusUpdate | null;
  setBranchStatusUpdate: (update: BranchStatusUpdate) => void;
  clearBranchStatusUpdate: () => void;
}

export const useBranchStatusStore = create<BranchStatusStore>((set) => ({
  lastBranchUpdate: null,

  setBranchStatusUpdate: (update) => set({ lastBranchUpdate: update }),

  clearBranchStatusUpdate: () => set({ lastBranchUpdate: null }),
}));