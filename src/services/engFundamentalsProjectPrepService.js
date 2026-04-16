const prisma = require("../utils/prismaClient");
const { GoogleGenAI } = require("@google/genai");
const logger = require("../utils/logger");

// ── Gemini client ─────────────────────────────────────────────────────────────

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

// ── AI question generation ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior engineering interviewer preparing tailored interview questions for a candidate presenting their project.

Given a project description, generate exactly:
- 5 architecture questions specific to what they built
- 3 trade-off questions about real decisions in their project
- 3 scaling questions relevant to their tech and use case

Rules:
- Questions must reference the actual project (tech stack, features, domain)
- No generic filler questions — every question should only make sense for THIS project
- Return ONLY valid JSON, no markdown, no explanation

Format:
{
  "architecture": ["q1", "q2", "q3", "q4", "q5"],
  "tradeoffs": ["q1", "q2", "q3"],
  "scaling": ["q1", "q2", "q3"]
}`;

async function generateQuestionsWithAI(description) {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
    contents: `Project description:\n${description}`,
  });

  const parsed = JSON.parse(response.text);

  if (
    !Array.isArray(parsed.architecture) || parsed.architecture.length < 1 ||
    !Array.isArray(parsed.tradeoffs)    || parsed.tradeoffs.length < 1 ||
    !Array.isArray(parsed.scaling)      || parsed.scaling.length < 1
  ) {
    throw new Error("AI returned unexpected questions shape");
  }

  return {
    architecture: parsed.architecture,
    tradeoffs: parsed.tradeoffs,
    scaling: parsed.scaling,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function notFound(msg = "Session not found") {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
}

// ── Service functions ─────────────────────────────────────────────────────────

async function generateSession(userId, description) {
  let questions;

  try {
    questions = await generateQuestionsWithAI(description);
  } catch (err) {
    logger.error(`[ProjectPrep] Gemini generation failed: ${err.message}`, { stack: err.stack });
    const serviceErr = new Error("Failed to generate questions. Please try again.");
    serviceErr.statusCode = 503;
    throw serviceErr;
  }

  const session = await prisma.projectPrepSession.create({
    data: { userId, description, questions },
  });

  return {
    sessionId: session.id,
    description: session.description,
    questions: session.questions,
    createdAt: session.createdAt,
  };
}

async function getMySessions(userId) {
  const sessions = await prisma.projectPrepSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, description: true, questions: true, createdAt: true },
  });

  return { sessions };
}

async function deleteSession(userId, sessionId) {
  const session = await prisma.projectPrepSession.findUnique({
    where: { id: sessionId },
    select: { id: true, userId: true },
  });

  if (!session) throw notFound();
  if (session.userId !== userId) {
    const err = new Error("Forbidden");
    err.statusCode = 403;
    throw err;
  }

  await prisma.projectPrepSession.delete({ where: { id: sessionId } });
}

module.exports = { generateSession, getMySessions, deleteSession };
