const prisma = require("../../../utils/prismaClient");
const { ok, badRequest, notFound } = require("../../../utils/apiResponse");

// ── GET /system-design/:questionId/canvas ─────────────────────────────────────

const getCanvas = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    const state = await prisma.sdCanvasState.findUnique({
      where: { questionId_userId: { questionId, userId } },
    });

    if (!state) {
      return ok(res, "Canvas state fetched", null);
    }

    return ok(res, "Canvas state fetched", {
      nodes: JSON.parse(state.nodesJson),
      edges: JSON.parse(state.edgesJson),
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /system-design/:questionId/canvas ─────────────────────────────────────

const saveCanvas = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const userId = req.user.id;
    const { nodes, edges } = req.body;

    if (!Array.isArray(nodes) || nodes.length > 50) {
      return badRequest(res, "nodes must be an array with at most 50 items");
    }
    if (!Array.isArray(edges) || edges.length > 100) {
      return badRequest(res, "edges must be an array with at most 100 items");
    }

    // Question must exist
    const questionExists = await prisma.systemDesignQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!questionExists) return notFound(res, "Question not found");

    const state = await prisma.sdCanvasState.upsert({
      where: { questionId_userId: { questionId, userId } },
      create: {
        questionId,
        userId,
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify(edges),
      },
      update: {
        nodesJson: JSON.stringify(nodes),
        edgesJson: JSON.stringify(edges),
      },
      select: { updatedAt: true },
    });

    return ok(res, "Canvas saved", { saved: true, updatedAt: state.updatedAt });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCanvas, saveCanvas };
