import { z } from "zod";

export const ownerSignupSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(4),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(4),
});

// password: z
//     .string()
//     .min(8)
//     .regex(
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
//       "Password must include uppercase, lowercase, number, and symbol"
//     )
