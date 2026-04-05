const { z } = require("zod");

// Judge0 supported language IDs (subset)
const SUPPORTED_LANGUAGE_IDS = [
  50,  // C
  54,  // C++
  62,  // Java
  63,  // JavaScript (Node.js)
  71,  // Python 3
  72,  // Ruby
  73,  // Rust
  74,  // TypeScript
];

const submitSchema = z.object({
  problemId: z.string().min(1, "Problem ID is required"),
  code: z.string().min(1, "Code cannot be empty"),
  languageId: z.number().int().refine(
    (id) => SUPPORTED_LANGUAGE_IDS.includes(id),
    { message: `Language ID must be one of: ${SUPPORTED_LANGUAGE_IDS.join(", ")}` }
  ),
  language: z.string().min(1, "Language name is required"),
});

module.exports = { submitSchema };
