// src/modules/branches/branches.schema.js

import { z } from "zod";

export const getBranchesSchema = z.object({
  include_inactive: z
    .boolean()
    .optional()
    .default(false),
});

export const switchBranchSchema = z.object({
  branch_id: z
    .string()
    .uuid(),
});
