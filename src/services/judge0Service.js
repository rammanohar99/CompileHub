const axios = require("axios");
const logger = require("../utils/logger");

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || null;

// Max polling attempts before giving up (each attempt ~1s apart)
const MAX_POLL_ATTEMPTS = 20;

// Build common Axios config (RapidAPI key is optional for self-hosted)
const getHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = process.env.JUDGE0_RAPIDAPI_HOST || "";
  }
  return headers;
};

/**
 * Submit a single run to Judge0 and return its token.
 * @param {string} sourceCode
 * @param {number} languageId
 * @param {string} stdin
 * @returns {Promise<string>} submission token
 */
const submitToJudge0 = async (sourceCode, languageId, stdin = "") => {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false`;

  const payload = {
    source_code: sourceCode,
    language_id: languageId,
    stdin,
  };

  const response = await axios.post(url, payload, { headers: getHeaders() });
  const token = response.data?.token;

  if (!token) {
    throw new Error("Judge0 did not return a submission token");
  }

  logger.info(`Judge0 token created: ${token}`);
  return token;
};

/**
 * Poll Judge0 until a terminal status is reached (or timeout).
 * @param {string} token
 * @returns {Promise<Object>} Judge0 result object
 */
const pollResult = async (token) => {
  const url = `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const response = await axios.get(url, { headers: getHeaders() });
    const data = response.data;
    const statusId = data?.status?.id;

    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4+=terminal
    if (statusId >= 3) {
      logger.info(`Judge0 result [${token}]: status=${data.status.description}`);
      return data;
    }

    // Wait 1 second between polls
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Judge0 polling timed out after ${MAX_POLL_ATTEMPTS} attempts`);
};

/**
 * Execute one test case against Judge0 and return a normalized result.
 * @param {string} sourceCode
 * @param {number} languageId
 * @param {string} stdin
 * @param {string} expectedOutput
 * @returns {Promise<{stdout, passed, executionTime, statusDescription, compileOutput}>}
 */
const runTestCase = async (sourceCode, languageId, stdin, expectedOutput) => {
  const token = await submitToJudge0(sourceCode, languageId, stdin);
  const result = await pollResult(token);

  const stdout = (result.stdout || "").trim();
  const expected = (expectedOutput || "").trim();
  const passed = stdout === expected;
  const executionTime = result.time ? parseFloat(result.time) : null;

  return {
    stdout,
    passed,
    executionTime,
    statusDescription: result.status?.description || "Unknown",
    compileOutput: result.compile_output || null,
    stderr: result.stderr || null,
  };
};

module.exports = { runTestCase };
