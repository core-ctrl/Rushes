const { z } = require("zod");

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
    username: z.string().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscores"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[0-9]/, "Must contain a number"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});

const watchlistSchema = z.object({
    mediaId: z.number().int().positive(),
    mediaType: z.enum(["movie", "tv"]),
    title: z.string().min(1),
    posterPath: z.string().nullable().optional(),
});

const feedbackSchema = z.object({
    userEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    message: z.string().min(1, "Message cannot be empty").max(2000, "Message cannot exceed 2000 characters"),
});

function validate(schema, body) {
    const result = schema.safeParse(body);
    if (!result.success) {
        const message = result.error.errors.map((e) => e.message).join(", ");
        return { success: false, error: message };
    }
    return { success: true, data: result.data };
}

module.exports = {
  registerSchema,
  loginSchema,
  watchlistSchema,
  feedbackSchema,
  validate
};
