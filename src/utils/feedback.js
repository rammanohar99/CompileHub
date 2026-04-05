/**
 * Intelligent feedback generator.
 * Compares actual output vs expected output and returns a human-readable hint.
 *
 * @param {string} userOutput   - stdout from Judge0 (trimmed)
 * @param {string} expectedOutput - expected output from test case
 * @returns {string} feedback message
 */
function generateFeedback(userOutput, expectedOutput) {
  const actual = (userOutput || "").trim();
  const expected = (expectedOutput || "").trim();

  if (actual === expected) return "All test cases passed!";

  // No output at all
  if (!actual) {
    return (
      "Your code produced no output. Make sure you are printing/returning the result. " +
      "Check for missing print statements or return values."
    );
  }

  const actualLines = actual.split("\n");
  const expectedLines = expected.split("\n");

  // ── Line count mismatch ──────────────────────────────────────────────────
  if (actualLines.length !== expectedLines.length) {
    if (actualLines.length > expectedLines.length) {
      return (
        `Your output has ${actualLines.length} lines but expected ${expectedLines.length}. ` +
        "You may be printing extra values. Check for duplicate prints or loop boundary conditions (off-by-one)."
      );
    } else {
      return (
        `Your output has ${actualLines.length} lines but expected ${expectedLines.length}. ` +
        "Some output is missing. Check if your loop terminates too early or a condition is filtering too aggressively."
      );
    }
  }

  // ── Per-line analysis ────────────────────────────────────────────────────
  const mismatchedLines = [];
  for (let i = 0; i < expectedLines.length; i++) {
    if (actualLines[i] !== expectedLines[i]) {
      mismatchedLines.push({ line: i + 1, got: actualLines[i], expected: expectedLines[i] });
    }
  }

  if (mismatchedLines.length === 0) return "Output matches!"; // shouldn't reach here

  const first = mismatchedLines[0];

  // Numeric off-by-one
  const gotNum = Number(first.got);
  const expNum = Number(first.expected);
  if (!isNaN(gotNum) && !isNaN(expNum)) {
    const diff = gotNum - expNum;
    if (diff === 1 || diff === -1) {
      return (
        `Off-by-one error detected on line ${first.line}: got ${first.got}, expected ${first.expected}. ` +
        "Review your loop bounds (use < instead of <=, or adjust index start/end by 1)."
      );
    }
    if (diff > 0) {
      return (
        `Your value on line ${first.line} is too large (got ${first.got}, expected ${first.expected}). ` +
        "Check for incorrect addition, wrong variable used, or extra iterations."
      );
    }
    if (diff < 0) {
      return (
        `Your value on line ${first.line} is too small (got ${first.got}, expected ${first.expected}). ` +
        "Check for subtraction errors, missing increments, or early termination."
      );
    }
  }

  // String similarity — detect case issues
  if (first.got.toLowerCase() === first.expected.toLowerCase()) {
    return (
      `Case mismatch on line ${first.line}: got "${first.got}", expected "${first.expected}". ` +
      "Your logic is correct but the output casing is wrong."
    );
  }

  // Trailing whitespace / extra spaces
  if (first.got.trim() === first.expected.trim()) {
    return (
      `Whitespace mismatch on line ${first.line}. ` +
      "Your answer is logically correct but has extra spaces or tabs. Strip trailing whitespace."
    );
  }

  // Many lines differ — likely wrong algorithm
  if (mismatchedLines.length > expectedLines.length / 2) {
    return (
      "More than half of the output lines are wrong. " +
      "This suggests a fundamental logic error. Re-read the problem statement and reconsider your approach."
    );
  }

  // Generic mismatch
  return (
    `Output mismatch on line ${first.line}: got "${first.got}", expected "${first.expected}". ` +
    "Check your logic, edge cases (empty input, single element, negative numbers), and data types."
  );
}

module.exports = { generateFeedback };
