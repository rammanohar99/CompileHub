const prisma = require("../../../utils/prismaClient");
const { ok, created, badRequest, forbidden, notFound } = require("../../../utils/apiResponse");

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`;
  return `${Math.floor(secs / 2592000)}mo ago`;
}

function parsePagination(query, defaultLimit = 20) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || defaultLimit));
  return { page, limit };
}

function formatComment(comment, requestingUserId) {
  const likedByMe = comment.likes?.some((l) => l.userId === requestingUserId) ?? false;
  return {
    id: comment.id,
    user: {
      id: comment.user.id,
      name: comment.user.name,
      avatarInitial: comment.user.name?.charAt(0)?.toUpperCase() ?? "?",
    },
    text: comment.text,
    likes: comment.likesCount,
    likedByMe,
    createdAt: comment.createdAt,
    timeAgo: timeAgo(comment.createdAt),
  };
}

// ── GET /system-design/:questionId/comments ───────────────────────────────────

const getComments = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { page, limit } = parsePagination(req.query);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.sdComment.findMany({
        where: { questionId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
          likes: { select: { userId: true } },
        },
      }),
      prisma.sdComment.count({ where: { questionId } }),
    ]);

    return ok(res, "Comments fetched", {
      comments: comments.map((c) => formatComment(c, req.user.id)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /system-design/:questionId/comments ──────────────────────────────────

const postComment = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return badRequest(res, "text is required");
    }
    const trimmed = text.trim();
    if (trimmed.length < 5 || trimmed.length > 1000) {
      return badRequest(res, "Comment must be between 5 and 1000 characters");
    }

    // Question must exist
    const questionExists = await prisma.systemDesignQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    });
    if (!questionExists) return notFound(res, "Question not found");

    const comment = await prisma.sdComment.create({
      data: { questionId, userId: req.user.id, text: trimmed },
      include: {
        user: { select: { id: true, name: true } },
        likes: { select: { userId: true } },
      },
    });

    return created(res, "Comment posted", formatComment(comment, req.user.id));
  } catch (err) {
    next(err);
  }
};

// ── POST /system-design/comments/:commentId/like ──────────────────────────────

const toggleLike = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await prisma.sdComment.findUnique({
      where: { id: commentId },
      select: { id: true, likesCount: true },
    });
    if (!comment) return notFound(res, "Comment not found");

    const existing = await prisma.sdCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    let liked;
    let updatedComment;

    if (existing) {
      // Remove like
      await prisma.$transaction([
        prisma.sdCommentLike.delete({ where: { id: existing.id } }),
        prisma.sdComment.update({
          where: { id: commentId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      liked = false;
      updatedComment = await prisma.sdComment.findUnique({
        where: { id: commentId },
        select: { likesCount: true },
      });
    } else {
      // Add like
      [, updatedComment] = await prisma.$transaction([
        prisma.sdCommentLike.create({ data: { commentId, userId } }),
        prisma.sdComment.update({
          where: { id: commentId },
          data: { likesCount: { increment: 1 } },
          select: { likesCount: true },
        }),
      ]);
      liked = true;
    }

    return ok(res, "Like toggled", { liked, likes: updatedComment.likesCount });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /system-design/comments/:commentId ─────────────────────────────────

const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    const comment = await prisma.sdComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });
    if (!comment) return notFound(res, "Comment not found");

    if (req.user.role !== "ADMIN" && comment.userId !== req.user.id) {
      return forbidden(res, "You can only delete your own comments");
    }

    await prisma.sdComment.delete({ where: { id: commentId } });

    return ok(res, "Comment deleted", { deleted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getComments, postComment, toggleLike, deleteComment };
