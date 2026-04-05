/**
 * Sends a consistent JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {boolean} success
 * @param {string} message
 * @param {*} data
 */
const sendResponse = (res, statusCode, success, message, data = null) => {
  const payload = { success, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

const ok = (res, message, data) => sendResponse(res, 200, true, message, data);
const created = (res, message, data) => sendResponse(res, 201, true, message, data);
const badRequest = (res, message) => sendResponse(res, 400, false, message);
const unauthorized = (res, message = "Unauthorized") => sendResponse(res, 401, false, message);
const forbidden = (res, message = "Forbidden") => sendResponse(res, 403, false, message);
const notFound = (res, message = "Not found") => sendResponse(res, 404, false, message);
const conflict = (res, message) => sendResponse(res, 409, false, message);
const tooMany = (res, message = "Too many requests") => sendResponse(res, 429, false, message);
const serverError = (res, message = "Internal server error") => sendResponse(res, 500, false, message);

module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, conflict, tooMany, serverError };
