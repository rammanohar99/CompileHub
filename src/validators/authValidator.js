const { z } = require("zod");

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

const logoutSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
    allSessions: z.boolean().optional(),
  })
  .refine((data) => data.allSessions === true || !!data.refreshToken, {
    message: "refreshToken is required unless allSessions=true",
    path: ["refreshToken"],
  });

module.exports = { signupSchema, loginSchema, refreshSchema, logoutSchema };
