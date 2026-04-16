const prisma = require("../utils/prismaClient");
const cache = require("../utils/cache");

// ── Helpers ───────────────────────────────────────────────────────────────────

function notFound(msg = "Template not found") {
  const err = new Error(msg);
  err.statusCode = 404;
  return err;
}

// ── Service functions ─────────────────────────────────────────────────────────

async function getAllTemplates(userId) {
  const templatesCacheKey = "eng:templates:published";
  let templates = cache.get(templatesCacheKey);

  if (!templates) {
    templates = await prisma.commTemplate.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
    });
    cache.set(templatesCacheKey, templates, 300); // 5 min
  }

  const views = await prisma.userTemplateView.findMany({
    where: { userId },
    select: { templateId: true },
  });

  const viewedSet = new Set(views.map((v) => v.templateId));

  return templates.map((t) => ({
    ...t,
    viewedByMe: viewedSet.has(t.id),
  }));
}

async function viewTemplate(userId, templateId) {
  const template = await prisma.commTemplate.findUnique({
    where: { id: templateId },
    select: { id: true },
  });
  if (!template) throw notFound();

  await prisma.userTemplateView.upsert({
    where: { userId_templateId: { userId, templateId } },
    create: { userId, templateId },
    update: { viewedAt: new Date() },
  });

  return { viewed: true };
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

async function createTemplate(data) {
  cache.del("eng:templates:published");
  return prisma.commTemplate.create({ data });
}

async function updateTemplate(id, data) {
  const existing = await prisma.commTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound();

  cache.del("eng:templates:published");
  return prisma.commTemplate.update({ where: { id }, data });
}

async function deleteTemplate(id) {
  const existing = await prisma.commTemplate.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound();

  cache.del("eng:templates:published");
  await prisma.commTemplate.delete({ where: { id } });
}

module.exports = {
  getAllTemplates,
  viewTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
