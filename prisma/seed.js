require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { seedAssessments } = require("../src/seed/assessments.seed");

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Problem definitions
// Each problem has:
//   - title, description, difficulty, companies, tags
//   - testCases[]: { input, expectedOutput, isHidden }
//
// INPUT FORMAT: always read from stdin
// OUTPUT FORMAT: always print to stdout (exact match, trimmed per line)
// ─────────────────────────────────────────────────────────────────────────────

const problems = [
  // ─── EASY ──────────────────────────────────────────────────────────────────

  {
    title: "Two Sum",
    difficulty: "EASY",
    companies: ["Amazon", "Google", "Microsoft", "Apple"],
    tags: ["Array", "Hash Table"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Return the answer as two space-separated integers on a single line (smaller index first).

**Input format:**
- Line 1: space-separated integers (the array)
- Line 2: the target integer

**Example:**
\`\`\`
Input:
2 7 11 15
9

Output:
0 1
\`\`\``,
    testCases: [
      { input: "2 7 11 15\n9",   expectedOutput: "0 1",  isHidden: false },
      { input: "3 2 4\n6",       expectedOutput: "1 2",  isHidden: false },
      { input: "3 3\n6",         expectedOutput: "0 1",  isHidden: true  },
      { input: "1 5 3 7 9\n12",  expectedOutput: "1 3",  isHidden: true  },
      { input: "-3 4 3 90\n0",   expectedOutput: "0 2",  isHidden: true  },
    ],
  },

  {
    title: "FizzBuzz",
    difficulty: "EASY",
    companies: ["Google", "Amazon", "Facebook"],
    tags: ["Math", "String"],
    description: `Given an integer \`n\`, print numbers from 1 to n, one per line.
- For multiples of 3, print \`Fizz\` instead.
- For multiples of 5, print \`Buzz\` instead.
- For multiples of both 3 and 5, print \`FizzBuzz\`.

**Input format:** A single integer n

**Example:**
\`\`\`
Input:  5
Output:
1
2
Fizz
4
Buzz
\`\`\``,
    testCases: [
      { input: "5",  expectedOutput: "1\n2\nFizz\n4\nBuzz",                                      isHidden: false },
      { input: "15", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz", isHidden: false },
      { input: "1",  expectedOutput: "1",                                                          isHidden: true  },
      { input: "3",  expectedOutput: "1\n2\nFizz",                                                 isHidden: true  },
      { input: "20", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz", isHidden: true },
    ],
  },

  {
    title: "Reverse a String",
    difficulty: "EASY",
    companies: ["Amazon", "Microsoft"],
    tags: ["String", "Two Pointers"],
    description: `Given a string, print its reverse.

**Input format:** A single line containing the string.

**Example:**
\`\`\`
Input:  hello
Output: olleh
\`\`\``,
    testCases: [
      { input: "hello",    expectedOutput: "olleh",    isHidden: false },
      { input: "abcde",    expectedOutput: "edcba",    isHidden: false },
      { input: "a",        expectedOutput: "a",        isHidden: true  },
      { input: "racecar",  expectedOutput: "racecar",  isHidden: true  },
      { input: "OpenAI",   expectedOutput: "IAnepO",   isHidden: true  },
    ],
  },

  {
    title: "Palindrome Check",
    difficulty: "EASY",
    companies: ["Amazon", "Adobe"],
    tags: ["String", "Two Pointers"],
    description: `Given a string, print \`true\` if it is a palindrome (reads the same forwards and backwards), otherwise print \`false\`. Ignore case.

**Input format:** A single line string.

**Example:**
\`\`\`
Input:  Racecar
Output: true
\`\`\``,
    testCases: [
      { input: "racecar",    expectedOutput: "true",  isHidden: false },
      { input: "Racecar",    expectedOutput: "true",  isHidden: false },
      { input: "hello",      expectedOutput: "false", isHidden: false },
      { input: "a",          expectedOutput: "true",  isHidden: true  },
      { input: "Madam",      expectedOutput: "true",  isHidden: true  },
      { input: "OpenAI",     expectedOutput: "false", isHidden: true  },
    ],
  },

  {
    title: "Fibonacci Number",
    difficulty: "EASY",
    companies: ["Amazon", "Google", "Goldman Sachs"],
    tags: ["Math", "Dynamic Programming", "Recursion"],
    description: `Given an integer \`n\`, print the n-th Fibonacci number (0-indexed).
F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2).

**Input format:** A single integer n (0 ≤ n ≤ 30)

**Example:**
\`\`\`
Input:  6
Output: 8
\`\`\``,
    testCases: [
      { input: "0",  expectedOutput: "0",    isHidden: false },
      { input: "1",  expectedOutput: "1",    isHidden: false },
      { input: "6",  expectedOutput: "8",    isHidden: false },
      { input: "10", expectedOutput: "55",   isHidden: true  },
      { input: "20", expectedOutput: "6765", isHidden: true  },
    ],
  },

  {
    title: "Valid Parentheses",
    difficulty: "EASY",
    companies: ["Amazon", "Google", "Facebook", "Microsoft"],
    tags: ["String", "Stack"],
    description: `Given a string containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, print \`true\` if the input string is valid (brackets are closed in the correct order), otherwise print \`false\`.

**Input format:** A single string.

**Example:**
\`\`\`
Input:  ()[]{}
Output: true

Input:  (]
Output: false
\`\`\``,
    testCases: [
      { input: "()",     expectedOutput: "true",  isHidden: false },
      { input: "()[]{}",expectedOutput: "true",  isHidden: false },
      { input: "(]",     expectedOutput: "false", isHidden: false },
      { input: "([)]",   expectedOutput: "false", isHidden: true  },
      { input: "{[]}",   expectedOutput: "true",  isHidden: true  },
      { input: "",       expectedOutput: "true",  isHidden: true  },
      { input: "(((",    expectedOutput: "false", isHidden: true  },
    ],
  },

  {
    title: "Missing Number",
    difficulty: "EASY",
    companies: ["Amazon", "Microsoft", "Bloomberg"],
    tags: ["Array", "Math", "Bit Manipulation"],
    description: `Given an array of n distinct integers in the range [0, n], find the missing number.

**Input format:** A single line of space-separated integers.

**Example:**
\`\`\`
Input:  3 0 1
Output: 2
\`\`\``,
    testCases: [
      { input: "3 0 1",       expectedOutput: "2", isHidden: false },
      { input: "0 1",         expectedOutput: "2", isHidden: false },
      { input: "9 6 4 2 3 5 7 0 1", expectedOutput: "8", isHidden: false },
      { input: "0",           expectedOutput: "1", isHidden: true  },
      { input: "1 0 3 4 5",   expectedOutput: "2", isHidden: true  },
    ],
  },

  {
    title: "Count Vowels",
    difficulty: "EASY",
    companies: ["Infosys", "TCS", "Wipro"],
    tags: ["String"],
    description: `Given a string, count the number of vowels (a, e, i, o, u — both uppercase and lowercase).

**Input format:** A single line string.

**Example:**
\`\`\`
Input:  Hello World
Output: 3
\`\`\``,
    testCases: [
      { input: "Hello World",       expectedOutput: "3", isHidden: false },
      { input: "aeiou",             expectedOutput: "5", isHidden: false },
      { input: "rhythm",            expectedOutput: "0", isHidden: false },
      { input: "The quick brown fox",expectedOutput: "5",isHidden: true  },
      { input: "AEIOU",             expectedOutput: "5", isHidden: true  },
    ],
  },

  {
    title: "Climbing Stairs",
    difficulty: "EASY",
    companies: ["Amazon", "Google", "Adobe", "Uber"],
    tags: ["Dynamic Programming", "Math"],
    description: `You are climbing a staircase with \`n\` steps. Each time you can climb 1 or 2 steps. Print the number of distinct ways to reach the top.

**Input format:** A single integer n (1 ≤ n ≤ 45)

**Example:**
\`\`\`
Input:  3
Output: 3
(Ways: 1+1+1, 1+2, 2+1)
\`\`\``,
    testCases: [
      { input: "1",  expectedOutput: "1",         isHidden: false },
      { input: "2",  expectedOutput: "2",         isHidden: false },
      { input: "3",  expectedOutput: "3",         isHidden: false },
      { input: "5",  expectedOutput: "8",         isHidden: true  },
      { input: "10", expectedOutput: "89",        isHidden: true  },
      { input: "20", expectedOutput: "10946",     isHidden: true  },
    ],
  },

  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "EASY",
    companies: ["Amazon", "Goldman Sachs", "Facebook", "Microsoft"],
    tags: ["Array", "Greedy", "Dynamic Programming"],
    description: `Given an array \`prices\` where \`prices[i]\` is the price of a stock on day i, find the maximum profit you can achieve by buying on one day and selling on a later day. If no profit is possible, print \`0\`.

**Input format:** A single line of space-separated integers.

**Example:**
\`\`\`
Input:  7 1 5 3 6 4
Output: 5
(Buy at 1, sell at 6)
\`\`\``,
    testCases: [
      { input: "7 1 5 3 6 4", expectedOutput: "5", isHidden: false },
      { input: "7 6 4 3 1",   expectedOutput: "0", isHidden: false },
      { input: "1 2",         expectedOutput: "1", isHidden: false },
      { input: "2 4 1 7",     expectedOutput: "6", isHidden: true  },
      { input: "3 3 3 3",     expectedOutput: "0", isHidden: true  },
      { input: "1 10 2 9 3",  expectedOutput: "9", isHidden: true  },
    ],
  },

  // ─── MEDIUM ────────────────────────────────────────────────────────────────

  {
    title: "Maximum Subarray (Kadane's Algorithm)",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Microsoft", "Goldman Sachs", "LinkedIn"],
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    description: `Given an integer array \`nums\`, find the contiguous subarray with the largest sum and print that sum.

**Input format:** A single line of space-separated integers.

**Example:**
\`\`\`
Input:  -2 1 -3 4 -1 2 1 -5 4
Output: 6
(Subarray: [4, -1, 2, 1])
\`\`\``,
    testCases: [
      { input: "-2 1 -3 4 -1 2 1 -5 4", expectedOutput: "6",  isHidden: false },
      { input: "1",                      expectedOutput: "1",  isHidden: false },
      { input: "5 4 -1 7 8",            expectedOutput: "23", isHidden: false },
      { input: "-1 -2 -3 -4",           expectedOutput: "-1", isHidden: true  },
      { input: "1 2 3 4 5",             expectedOutput: "15", isHidden: true  },
      { input: "-2 -3 4 -1 -2 1 5 -3",  expectedOutput: "7",  isHidden: true  },
    ],
  },

  {
    title: "Longest Substring Without Repeating Characters",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Google", "Facebook", "Microsoft", "Adobe"],
    tags: ["String", "Sliding Window", "Hash Table"],
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

**Input format:** A single line string.

**Example:**
\`\`\`
Input:  abcabcbb
Output: 3
(Substring: "abc")
\`\`\``,
    testCases: [
      { input: "abcabcbb", expectedOutput: "3", isHidden: false },
      { input: "bbbbb",    expectedOutput: "1", isHidden: false },
      { input: "pwwkew",   expectedOutput: "3", isHidden: false },
      { input: "",         expectedOutput: "0", isHidden: true  },
      { input: "au",       expectedOutput: "2", isHidden: true  },
      { input: "dvdf",     expectedOutput: "3", isHidden: true  },
      { input: "abcdefgh", expectedOutput: "8", isHidden: true  },
    ],
  },

  {
    title: "Merge Intervals",
    difficulty: "MEDIUM",
    companies: ["Google", "Facebook", "Amazon", "Oracle"],
    tags: ["Array", "Sorting"],
    description: `Given a list of intervals, merge all overlapping intervals and print the result.

**Input format:**
- Line 1: integer n (number of intervals)
- Next n lines: two space-separated integers (start end) for each interval

**Output format:** One merged interval per line (space-separated).

**Example:**
\`\`\`
Input:
4
1 3
2 6
8 10
15 18

Output:
1 6
8 10
15 18
\`\`\``,
    testCases: [
      {
        input: "4\n1 3\n2 6\n8 10\n15 18",
        expectedOutput: "1 6\n8 10\n15 18",
        isHidden: false,
      },
      {
        input: "2\n1 4\n4 5",
        expectedOutput: "1 5",
        isHidden: false,
      },
      {
        input: "1\n5 10",
        expectedOutput: "5 10",
        isHidden: true,
      },
      {
        input: "3\n1 4\n2 3\n5 7",
        expectedOutput: "1 4\n5 7",
        isHidden: true,
      },
      {
        input: "5\n1 2\n3 4\n5 6\n7 8\n9 10",
        expectedOutput: "1 2\n3 4\n5 6\n7 8\n9 10",
        isHidden: true,
      },
    ],
  },

  {
    title: "Binary Search",
    difficulty: "EASY",
    companies: ["Amazon", "Google", "Microsoft"],
    tags: ["Array", "Binary Search"],
    description: `Given a sorted array of integers and a target, print the index of the target using binary search. If not found, print \`-1\`.

**Input format:**
- Line 1: space-separated sorted integers
- Line 2: target integer

**Example:**
\`\`\`
Input:
-1 0 3 5 9 12
9

Output: 4
\`\`\``,
    testCases: [
      { input: "-1 0 3 5 9 12\n9",  expectedOutput: "4",  isHidden: false },
      { input: "-1 0 3 5 9 12\n2",  expectedOutput: "-1", isHidden: false },
      { input: "5\n5",              expectedOutput: "0",  isHidden: false },
      { input: "1 3 5 7 9 11\n7",   expectedOutput: "3",  isHidden: true  },
      { input: "2 4 6 8 10\n1",     expectedOutput: "-1", isHidden: true  },
      { input: "1 2 3 4 5 6 7\n1",  expectedOutput: "0",  isHidden: true  },
    ],
  },

  {
    title: "Check Anagram",
    difficulty: "EASY",
    companies: ["Amazon", "Microsoft", "Adobe"],
    tags: ["String", "Hash Table", "Sorting"],
    description: `Given two strings, print \`true\` if they are anagrams of each other (contain the same characters with the same frequency, ignoring case), otherwise print \`false\`.

**Input format:** Two lines, one string per line.

**Example:**
\`\`\`
Input:
Anagram
nagaram

Output: true
\`\`\``,
    testCases: [
      { input: "Anagram\nnagaram",  expectedOutput: "true",  isHidden: false },
      { input: "rat\ncar",          expectedOutput: "false", isHidden: false },
      { input: "listen\nsilent",    expectedOutput: "true",  isHidden: false },
      { input: "hello\nworld",      expectedOutput: "false", isHidden: true  },
      { input: "Triangle\nIntegral",expectedOutput: "true",  isHidden: true  },
      { input: "a\nab",             expectedOutput: "false", isHidden: true  },
    ],
  },

  {
    title: "Rotate Array",
    difficulty: "MEDIUM",
    companies: ["Microsoft", "Amazon", "Bloomberg"],
    tags: ["Array", "Two Pointers", "Math"],
    description: `Given an array of integers and a value k, rotate the array to the right by k steps and print the result.

**Input format:**
- Line 1: space-separated integers
- Line 2: integer k

**Output format:** Space-separated integers on a single line.

**Example:**
\`\`\`
Input:
1 2 3 4 5 6 7
3

Output: 5 6 7 1 2 3 4
\`\`\``,
    testCases: [
      { input: "1 2 3 4 5 6 7\n3", expectedOutput: "5 6 7 1 2 3 4", isHidden: false },
      { input: "-1 -100 3 99\n2",  expectedOutput: "3 99 -1 -100",  isHidden: false },
      { input: "1 2\n1",           expectedOutput: "2 1",            isHidden: false },
      { input: "1\n0",             expectedOutput: "1",              isHidden: true  },
      { input: "1 2 3\n6",         expectedOutput: "1 2 3",          isHidden: true  },
      { input: "1 2 3 4 5\n7",     expectedOutput: "4 5 1 2 3",      isHidden: true  },
    ],
  },

  {
    title: "Longest Common Prefix",
    difficulty: "EASY",
    companies: ["Google", "Amazon", "Uber"],
    tags: ["String", "Trie"],
    description: `Given n strings, find their longest common prefix. If there is no common prefix, print an empty line.

**Input format:**
- Line 1: integer n
- Next n lines: one string each

**Example:**
\`\`\`
Input:
3
flower
flow
flight

Output: fl
\`\`\``,
    testCases: [
      { input: "3\nflower\nflow\nflight", expectedOutput: "fl",   isHidden: false },
      { input: "3\ndog\nracecar\ncar",    expectedOutput: "",     isHidden: false },
      { input: "1\nalone",               expectedOutput: "alone",isHidden: false },
      { input: "2\ninterspecies\ninterstellar", expectedOutput: "inters", isHidden: true },
      { input: "3\nabc\nabc\nabc",        expectedOutput: "abc",  isHidden: true  },
      { input: "2\na\nab",               expectedOutput: "a",    isHidden: true  },
    ],
  },

  {
    title: "3Sum",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Facebook", "Google", "Microsoft"],
    tags: ["Array", "Two Pointers", "Sorting"],
    description: `Given an array of integers, find all unique triplets that sum to zero. Print each triplet on a new line, space-separated, sorted in non-descending order. Print triplets in lexicographic order.

**Input format:** A single line of space-separated integers.

**Example:**
\`\`\`
Input:  -1 0 1 2 -1 -4
Output:
-1 -1 2
-1 0 1
\`\`\``,
    testCases: [
      { input: "-1 0 1 2 -1 -4", expectedOutput: "-1 -1 2\n-1 0 1", isHidden: false },
      { input: "0 1 1",           expectedOutput: "",                 isHidden: false },
      { input: "0 0 0",           expectedOutput: "0 0 0",            isHidden: false },
      { input: "-2 0 1 1 2",      expectedOutput: "-2 0 2\n-2 1 1",   isHidden: true  },
      { input: "0 0 0 0",         expectedOutput: "0 0 0",            isHidden: true  },
    ],
  },

  {
    title: "Number of Islands",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Google", "Facebook", "Microsoft", "Bloomberg"],
    tags: ["BFS", "DFS", "Matrix", "Union Find"],
    description: `Given an m×n grid of \`1\`s (land) and \`0\`s (water), count the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

**Input format:**
- Line 1: two integers m n (rows and columns)
- Next m lines: n space-separated values (0 or 1)

**Example:**
\`\`\`
Input:
4 5
1 1 1 1 0
1 1 0 1 0
1 1 0 0 0
0 0 0 0 0

Output: 1
\`\`\``,
    testCases: [
      {
        input: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0",
        expectedOutput: "1",
        isHidden: false,
      },
      {
        input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1",
        expectedOutput: "3",
        isHidden: false,
      },
      {
        input: "1 1\n1",
        expectedOutput: "1",
        isHidden: true,
      },
      {
        input: "1 1\n0",
        expectedOutput: "0",
        isHidden: true,
      },
      {
        input: "3 3\n1 0 1\n0 1 0\n1 0 1",
        expectedOutput: "5",
        isHidden: true,
      },
    ],
  },

  {
    title: "Coin Change",
    difficulty: "MEDIUM",
    companies: ["Amazon", "Google", "Microsoft", "Goldman Sachs"],
    tags: ["Dynamic Programming", "BFS"],
    description: `Given an array of coin denominations and a target amount, find the fewest number of coins needed to make up that amount. If it is not possible, print \`-1\`.

**Input format:**
- Line 1: space-separated coin denominations
- Line 2: target amount

**Example:**
\`\`\`
Input:
1 5 6 9
11

Output: 2
(5 + 6 = 11)
\`\`\``,
    testCases: [
      { input: "1 5 6 9\n11",  expectedOutput: "2",  isHidden: false },
      { input: "1 2 5\n11",    expectedOutput: "3",  isHidden: false },
      { input: "2\n3",         expectedOutput: "-1", isHidden: false },
      { input: "1\n0",         expectedOutput: "0",  isHidden: true  },
      { input: "1 5 10 25\n36",expectedOutput: "3",  isHidden: true  },
      { input: "2 5 10\n3",    expectedOutput: "-1", isHidden: true  },
    ],
  },

  // ─── HARD ──────────────────────────────────────────────────────────────────

  {
    title: "Trapping Rain Water",
    difficulty: "HARD",
    companies: ["Amazon", "Google", "Microsoft", "Goldman Sachs", "Apple"],
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
    description: `Given an array of non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

**Input format:** A single line of space-separated non-negative integers.

**Example:**
\`\`\`
Input:  0 1 0 2 1 0 1 3 2 1 2 1
Output: 6
\`\`\``,
    testCases: [
      { input: "0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6", isHidden: false },
      { input: "4 2 0 3 2 5",             expectedOutput: "9", isHidden: false },
      { input: "1 0 1",                   expectedOutput: "1", isHidden: false },
      { input: "3 0 2 0 4",               expectedOutput: "7", isHidden: true  },
      { input: "1 2 3 4 5",               expectedOutput: "0", isHidden: true  },
      { input: "5 4 1 2",                 expectedOutput: "1", isHidden: true  },
    ],
  },

  {
    title: "Median of Two Sorted Arrays",
    difficulty: "HARD",
    companies: ["Google", "Amazon", "Microsoft", "Apple", "Adobe"],
    tags: ["Array", "Binary Search", "Divide and Conquer"],
    description: `Given two sorted arrays, find the median of the merged sorted array. Print the result as a decimal (e.g., \`2.5\` or \`2.0\`).

**Input format:**
- Line 1: space-separated integers (first sorted array), or empty line if array is empty
- Line 2: space-separated integers (second sorted array), or empty line if array is empty

**Example:**
\`\`\`
Input:
1 3
2

Output: 2.0
\`\`\``,
    testCases: [
      { input: "1 3\n2",       expectedOutput: "2.0",  isHidden: false },
      { input: "1 2\n3 4",     expectedOutput: "2.5",  isHidden: false },
      { input: "0 0\n0 0",     expectedOutput: "0.0",  isHidden: false },
      { input: "\n1",          expectedOutput: "1.0",  isHidden: true  },
      { input: "2\n1 3 4",     expectedOutput: "2.5",  isHidden: true  },
      { input: "1 2 3\n4 5 6", expectedOutput: "3.5",  isHidden: true  },
    ],
  },

  {
    title: "Word Break",
    difficulty: "HARD",
    companies: ["Amazon", "Google", "Facebook", "Uber"],
    tags: ["String", "Dynamic Programming", "Trie", "Hash Table"],
    description: `Given a string \`s\` and a dictionary of words, determine if \`s\` can be segmented into a space-separated sequence of one or more dictionary words. Print \`true\` or \`false\`.

**Input format:**
- Line 1: the string s
- Line 2: space-separated dictionary words

**Example:**
\`\`\`
Input:
leetcode
leet code

Output: true
\`\`\``,
    testCases: [
      { input: "leetcode\nleet code",           expectedOutput: "true",  isHidden: false },
      { input: "applepenapple\napple pen",       expectedOutput: "true",  isHidden: false },
      { input: "catsandog\ncats dog sand and cat",expectedOutput: "false", isHidden: false },
      { input: "goalspecial\ngo goal goals special",expectedOutput: "true",isHidden: true  },
      { input: "cars\ncars ca ar",               expectedOutput: "true",  isHidden: true  },
      { input: "abcdef\nab cd gh",               expectedOutput: "false", isHidden: true  },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// System Design Questions
// 4 EASY · 4 MEDIUM · 4 HARD
// solution shape: { overview, steps[], tradeoffs[], diagram }
// ─────────────────────────────────────────────────────────────────────────────

const systemDesignQuestions = [

  // ══════════════════════════════════════════════════════════════════════════
  // EASY
  // ══════════════════════════════════════════════════════════════════════════

  {
    title: "Design a URL Shortener",
    difficulty: "EASY",
    description:
      "Design a service like bit.ly that converts a long URL into a short alias " +
      "(e.g., https://short.ly/aB3kPz). When a user visits the short URL they are " +
      "redirected to the original URL. The service must handle hundreds of millions " +
      "of mappings with sub-10ms redirect latency at global scale.",
    requirements: [
      "Shorten a given long URL and return a unique short alias",
      "Redirect users to the original URL when the short alias is accessed",
      "Support optional user-defined custom aliases",
      "Support optional per-URL expiration (TTL)",
      "Track click count per short URL for basic analytics",
      "Delete or deactivate a short URL on demand",
    ],
    constraints: [
      "100 million URLs stored, growing at ~10 million/month",
      "Read-heavy: 100:1 read-to-write ratio (10 billion redirects/month)",
      "Redirect latency < 10 ms at p99",
      "Short code: 6–8 characters using Base62 [a-zA-Z0-9]",
      "Storage: ~500 bytes per URL record → ~50 GB for 100 M URLs",
      "High availability: 99.99% uptime required",
      "Short codes must not be predictable or enumerable",
    ],
    hints: [
      "What encoding scheme gives you enough combinations for 100 M URLs in 6-7 characters? Think Base62.",
      "Counter-based IDs (auto-increment → Base62) avoid hash collisions entirely — what are the downsides vs hashing the URL?",
      "The redirect path is the hot path. What single data structure would cut database round-trips to near zero?",
      "How would you make the redirect service stateless so it scales horizontally behind a load balancer?",
      "Custom aliases share the same namespace as auto-generated codes — how do you prevent collisions?",
      "Click analytics are write-heavy on hot URLs. How do you track them without making every redirect synchronously write to the DB?",
    ],
    solution: {
      overview:
        "Encode an auto-incremented (or Snowflake) ID as a Base62 string to generate the short code. " +
        "Store the long↔short mapping in PostgreSQL. Place Redis in front as a read-through cache with LRU eviction. " +
        "Separate the stateless redirect service (read path) from the shortening service (write path) so each scales independently. " +
        "Publish click events to Kafka for async analytics — never block the redirect on a DB write.",
      steps: [
        {
          step: "API Design",
          detail:
            "POST /shorten { longUrl, customAlias?, expiresAt? } → 201 { shortUrl, code, expiresAt }. " +
            "GET /{code} → 302 Location: <longUrl>. " +
            "DELETE /{code} → 204. " +
            "GET /{code}/stats → { clicks, createdAt, lastAccessedAt }.",
        },
        {
          step: "Database Schema",
          detail:
            "Table urls: id BIGSERIAL PK, short_code VARCHAR(8) UNIQUE NOT NULL, " +
            "long_url TEXT NOT NULL, user_id UUID, expires_at TIMESTAMPTZ, " +
            "click_count BIGINT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(). " +
            "Index: UNIQUE on short_code. Partial index on expires_at for cleanup jobs.",
        },
        {
          step: "Short Code Generation",
          detail:
            "Approach A (preferred): auto-increment ID converted to Base62. " +
            "6 chars = 62^6 = 56 billion combinations. " +
            "Approach B: first 7 hex chars of SHA-256(longUrl + salt) + collision retry loop. " +
            "Use a distributed ID generator (Snowflake) if sharding across multiple write nodes.",
        },
        {
          step: "Caching Strategy",
          detail:
            "Redis hash: key = short_code, value = long_url + expires_at. " +
            "TTL = URL expiry (or 24 h default). LRU eviction policy. " +
            "Top 20% of URLs serve ~80% of traffic — warm cache on creation. " +
            "Cache-aside: on miss, load from DB and repopulate Redis.",
        },
        {
          step: "Scaling Strategy",
          detail:
            "Read replicas for PostgreSQL. Redirect servers are stateless — horizontal scale behind ALB. " +
            "CDN (CloudFront/Fastly) can cache redirect responses for non-expiring URLs. " +
            "Shard DB by short_code hash if write throughput exceeds single-node limit (~10K writes/s).",
        },
        {
          step: "Analytics",
          detail:
            "Redirect service publishes { code, timestamp, referrer, ip_country } to Kafka topic url-clicks. " +
            "Flink/Spark Streaming consumer aggregates counts and writes to a separate analytics DB (ClickHouse). " +
            "Avoids write amplification on hot-URL rows.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Short Code Generation",
          tradeoff:
            "Counter-based (sequential, no collisions, easy to shard by range) vs Hash-based " +
            "(random distribution, collision retry adds latency). Counter-based wins for production scale.",
        },
        {
          aspect: "Redirect HTTP Status",
          tradeoff:
            "301 Permanent (browser caches — fewer server hits, cheaper) vs 302 Temporary " +
            "(every redirect hits server — accurate click tracking). Use 302 when analytics matter.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Favour AP (availability + partition tolerance). A slightly stale redirect is acceptable; " +
            "a failed redirect is not. Use eventual consistency for click counts.",
        },
        {
          aspect: "Storage Engine",
          tradeoff:
            "PostgreSQL (ACID, simple) is sufficient to ~50K writes/s. " +
            "DynamoDB (key-value, auto-sharding) if you need to exceed that with zero ops overhead.",
        },
        {
          aspect: "Custom Aliases",
          tradeoff:
            "Stored in the same table with a UNIQUE constraint. Reserve a namespace prefix for " +
            "auto-generated codes (e.g., auto codes never start with '_') to prevent collisions with custom aliases.",
        },
      ],
      diagram: {
        components: [
          "Client",
          "CDN / Edge",
          "Load Balancer",
          "Redirect Service (stateless, read path)",
          "Shortening Service (write path)",
          "Redis Cache",
          "PostgreSQL (primary + read replicas)",
          "Kafka",
          "Analytics Consumer",
          "ClickHouse",
        ],
        flow:
          "Redirect: Client → CDN → LB → Redirect Service → Redis (hit → 302). " +
          "On cache miss: Redis → PostgreSQL read replica → populate Redis → 302. " +
          "Shorten: Client → LB → Shortening Service → PostgreSQL primary → return shortUrl. " +
          "Analytics: Redirect Service → Kafka → Analytics Consumer → ClickHouse.",
      },
    },
  },

  {
    title: "Design a Rate Limiter",
    difficulty: "EASY",
    description:
      "Design a rate limiter middleware that restricts how many requests a client " +
      "(identified by API key or IP address) can make to a backend service within a " +
      "rolling time window. The limiter must add less than 1 ms of latency and work " +
      "correctly across a horizontally scaled fleet of API servers.",
    requirements: [
      "Limit requests per client per time window (e.g., 1000 req/min)",
      "Return HTTP 429 Too Many Requests with a Retry-After header when the limit is breached",
      "Support different rate limit tiers per API key (free vs paid)",
      "Work correctly in a distributed environment (multiple API server instances)",
      "Allow soft limits (warn at 80%) and hard limits (block at 100%)",
      "Provide remaining quota in response headers (X-RateLimit-Remaining, X-RateLimit-Reset)",
    ],
    constraints: [
      "Overhead per request < 1 ms (p99)",
      "Distributed fleet: 50–200 API server instances",
      "1 million unique clients, peak 500K requests/second total",
      "Time window granularity: per-second, per-minute, per-hour, per-day",
      "High availability: rate limiter failure must not block legitimate traffic (fail open)",
      "Rules must be updatable without redeployment",
    ],
    hints: [
      "Four common algorithms: fixed window counter, sliding window log, sliding window counter, token bucket, leaky bucket — what are the burst-traffic implications of each?",
      "A fixed window counter has an edge case where a client can double their quota at window boundaries — how does sliding window fix this?",
      "Redis INCR + EXPIRE is the classic distributed counter — but is it atomic? What race condition exists and how do Lua scripts or Redis pipelines solve it?",
      "Token bucket allows controlled bursting (useful for APIs). Leaky bucket smooths traffic to a constant rate. Which fits an API gateway better?",
      "Where should the rate limiter sit — in the API gateway, as a sidecar, or in application code? What are the tradeoffs?",
      "If Redis becomes unavailable, should you fail open (allow all traffic) or fail closed (block all)? What does each choice mean for your SLA?",
    ],
    solution: {
      overview:
        "Implement a sliding window counter algorithm backed by Redis. " +
        "For each client key, maintain a sorted set (ZSET) of request timestamps or use two fixed-window counters " +
        "for an approximate sliding window. Deploy as an API Gateway plugin or sidecar so it intercepts requests " +
        "before they reach upstream services. Use Lua scripts for atomic Redis operations. Fail open if Redis is unreachable.",
      steps: [
        {
          step: "Algorithm Choice",
          detail:
            "Sliding Window Counter (approximate): keep two fixed-window counters (current + previous window). " +
            "Weighted count = prev_count × (1 - elapsed_fraction) + curr_count. " +
            "O(1) memory per client. Accurate to ±0.003% of limit. " +
            "Alternative: Token Bucket with Redis DECR for burst-friendly APIs.",
        },
        {
          step: "Redis Data Structure",
          detail:
            "Key: rate:{clientId}:{windowStart}  Value: integer counter  TTL: 2 × window_size. " +
            "Atomic increment + TTL set via Lua script to avoid race conditions between INCR and EXPIRE. " +
            "Pipeline both window keys in one round-trip to keep latency < 0.5 ms.",
        },
        {
          step: "Middleware Integration",
          detail:
            "API Gateway plugin (Kong/Nginx Lua) or Express/Fastify middleware. " +
            "Intercept request → extract client key (API key from header, or IP) → " +
            "call Redis → allow/deny → inject X-RateLimit-* headers into response. " +
            "Async header injection on allowed requests to avoid blocking.",
        },
        {
          step: "Rule Configuration",
          detail:
            "Store tier rules in Redis Hash: rate:config:{tier} → { limit, window_seconds }. " +
            "API key → tier mapping in PostgreSQL (cached in Redis with 60 s TTL). " +
            "Hot reload: rules update propagates via Redis pub/sub to all gateway nodes.",
        },
        {
          step: "Scaling Strategy",
          detail:
            "Redis Cluster with consistent hashing by clientId (all requests for a client hit one shard). " +
            "Deploy Redis in primary-replica mode with automatic failover (Redis Sentinel or ElastiCache). " +
            "Rate limiter nodes are stateless — scale horizontally behind the load balancer.",
        },
        {
          step: "Failure Handling",
          detail:
            "Circuit breaker wraps Redis calls with a 500 µs timeout. " +
            "On timeout or error: log the failure, fail open (allow request), increment a Prometheus counter. " +
            "Alert when failure rate > 1% — prevents Redis outage from becoming a full service outage.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Algorithm Accuracy vs Cost",
          tradeoff:
            "Sliding window log (exact) stores every request timestamp — O(n) memory per client, expensive at scale. " +
            "Sliding window counter (approximate) uses O(1) memory with <0.01% inaccuracy. Choose approximate for production.",
        },
        {
          aspect: "Fixed Window Boundary Burst",
          tradeoff:
            "Fixed window allows 2× the limit at window boundaries (e.g., 1000 req at 23:59:59 + 1000 at 00:00:00). " +
            "Sliding window eliminates this — essential for security-sensitive endpoints.",
        },
        {
          aspect: "Centralised vs Local Limiting",
          tradeoff:
            "Centralised Redis: accurate but adds network hop. " +
            "Local in-memory counter per node: zero latency but allows N× the limit with N nodes. " +
            "Hybrid: local counter with periodic Redis sync — good for very high-traffic, tolerates slight over-counting.",
        },
        {
          aspect: "Fail Open vs Fail Closed",
          tradeoff:
            "Fail open preserves availability (user-facing SLA) but exposes backend to traffic spikes. " +
            "Fail closed protects the backend but breaks the API. " +
            "Standard choice: fail open for external APIs, fail closed for internal admin APIs.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Rate limiting favours AP — it is acceptable to occasionally allow a few extra requests " +
            "during network partitions rather than blocking legitimate traffic while waiting for consensus.",
        },
      ],
      diagram: {
        components: [
          "Client",
          "API Gateway / Load Balancer",
          "Rate Limiter Middleware",
          "Redis Cluster (sharded by clientId)",
          "Rule Config Store (PostgreSQL + Redis cache)",
          "Upstream API Service",
          "Prometheus + Grafana",
        ],
        flow:
          "Client → API Gateway → Rate Limiter Middleware → Redis (atomic INCR + TTL check). " +
          "Allowed: inject X-RateLimit-* headers → forward to Upstream Service. " +
          "Denied: return 429 + Retry-After. " +
          "Redis down: circuit breaker trips → fail open → allow request + alert.",
      },
    },
  },

  {
    title: "Design a Pastebin",
    difficulty: "EASY",
    description:
      "Design a service like Pastebin.com that lets users paste and share plain text " +
      "or code snippets via a unique short URL. Pastes can be anonymous or tied to a " +
      "user account, optionally private, and can expire after a set duration. " +
      "The service must handle millions of pastes with fast read performance.",
    requirements: [
      "Create a paste (text/code) and receive a unique shareable URL",
      "Retrieve paste content by its unique ID",
      "Support optional expiration (burn after N views or after a time TTL)",
      "Support public, unlisted, and private visibility settings",
      "Support syntax highlighting metadata (language tag)",
      "Allow authenticated users to view, edit, and delete their own pastes",
    ],
    constraints: [
      "5 million new pastes/day; average paste size 10 KB, max 10 MB",
      "Read-heavy: 10:1 read-to-write ratio",
      "Total storage: ~50 TB after 3 years (assuming 10 KB avg × 5M/day × 365 × 3)",
      "Paste retrieval latency < 50 ms (p99)",
      "Short ID: 8 Base62 characters (62^8 ≈ 218 trillion combinations)",
      "Large pastes (> 1 MB) must not be stored in the primary database",
    ],
    hints: [
      "Paste content can be large — should it live in the database or in object storage like S3?",
      "The metadata (ID, owner, visibility, language, TTL) is small and relational — what DB fits best?",
      "How would you efficiently serve the most recently read pastes without hitting the database on every request?",
      "A paste URL needs to be short and unguessable — how is this similar to URL shortening, and where does it differ?",
      "How do you implement 'burn after reading' (one-time pastes) atomically to avoid race conditions with concurrent readers?",
      "For expired pastes, immediate deletion is expensive — what is a simpler approach that still hides expired content from users?",
    ],
    solution: {
      overview:
        "Split the data model: store paste metadata (ID, owner, language, TTL, visibility) in PostgreSQL, " +
        "and paste content in object storage (S3 / R2). " +
        "Generate an 8-char Base62 ID (counter-based or random with collision check). " +
        "Cache hot paste metadata + content URL in Redis. " +
        "Use lazy expiry: mark pastes as expired via a TTL flag rather than immediately deleting rows; " +
        "a background job purges stale records nightly.",
      steps: [
        {
          step: "API Design",
          detail:
            "POST /pastes { content, language?, expiresAt?, visibility, burnAfterRead? } → 201 { pasteId, url }. " +
            "GET /pastes/{id} → 200 { content, language, createdAt, ... } or 404/410 Gone. " +
            "DELETE /pastes/{id} → 204 (owner only). " +
            "GET /pastes?userId={id} → paginated list (private pastes filtered by auth).",
        },
        {
          step: "Database Schema",
          detail:
            "Table pastes: id VARCHAR(8) PK, owner_id UUID, language VARCHAR(32), " +
            "visibility ENUM(public,unlisted,private), content_key TEXT (S3 object key), " +
            "burn_after_read BOOLEAN, view_count INT, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ. " +
            "Index on owner_id for user paste lists. Partial index WHERE expires_at IS NOT NULL for cleanup job.",
        },
        {
          step: "Content Storage",
          detail:
            "Pastes ≤ 1 KB: store inline in the DB column (content TEXT) for latency. " +
            "Pastes > 1 KB: upload to S3 at key pastes/{pasteId}. Store object URL in content_key. " +
            "Serve via a CloudFront CDN distribution — cheap bandwidth + global edge caching for public pastes.",
        },
        {
          step: "Caching Strategy",
          detail:
            "Redis string: key = paste:{id}, value = JSON { content, language, visibility }. TTL = paste expiry or 1 hour. " +
            "Cache only public/unlisted pastes — private pastes always bypass cache for security. " +
            "Eviction policy: allkeys-lru.",
        },
        {
          step: "Burn-After-Read",
          detail:
            "Atomic check-and-delete using Redis SET with NX (only set if not exists): " +
            "SETNX burn:{id} 1 EX 10. First reader wins → marks burned, deletes paste from DB asynchronously. " +
            "Subsequent readers get 410 Gone immediately from the Redis key.",
        },
        {
          step: "Expiry & Cleanup",
          detail:
            "Lazy expiry: GET /pastes/{id} checks expires_at before returning content. Returns 410 if expired. " +
            "Nightly cron job: DELETE FROM pastes WHERE expires_at < now() - interval '1 day'. " +
            "Also deletes corresponding S3 objects via S3 Lifecycle rules (tag-based).",
        },
      ],
      tradeoffs: [
        {
          aspect: "DB vs Object Storage for Content",
          tradeoff:
            "Storing content in PostgreSQL is simple but TOAST columns cause table bloat and slow backups. " +
            "S3 is cheap, infinitely scalable, and keeps the DB lean — slight added latency for a second network hop.",
        },
        {
          aspect: "Random ID vs Counter ID",
          tradeoff:
            "Random 8-char Base62 (collision probability negligible at 5 M/day) prevents enumeration. " +
            "Counter-based IDs are sequential — easier to enumerate pastes. For user-generated public content, random is safer.",
        },
        {
          aspect: "Eager vs Lazy Expiry",
          tradeoff:
            "Eager deletion (cron every minute) keeps storage clean but is expensive at scale. " +
            "Lazy deletion (check on read + daily batch) is simpler and sufficient unless storage cost is critical.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Favour AP. Serving slightly stale cached content for a just-expired paste is acceptable. " +
            "Consistency matters more for burn-after-read pastes — use Redis atomic operations there.",
        },
        {
          aspect: "CDN for Public Content",
          tradeoff:
            "CDN dramatically reduces origin load for viral pastes but makes immediate deletion difficult " +
            "(CDN cache invalidation is asynchronous and can take 1–5 minutes). " +
            "Acceptable for most content; consider short TTLs (60 s) for sensitive pastes.",
        },
      ],
      diagram: {
        components: [
          "Client",
          "CDN (CloudFront)",
          "Load Balancer",
          "Paste API Service",
          "Redis Cache",
          "PostgreSQL (metadata)",
          "S3 / Object Storage (content)",
          "Cleanup Cron Job",
        ],
        flow:
          "Read: Client → CDN (public paste cache hit → content served). " +
          "CDN miss → Paste API → Redis (hit → return JSON). " +
          "Redis miss → PostgreSQL (metadata) + S3 (content) → populate Redis → return. " +
          "Write: Client → Paste API → S3 (if large) + PostgreSQL → return pasteId.",
      },
    },
  },

  {
    title: "Design a Leaderboard System",
    difficulty: "EASY",
    description:
      "Design a real-time leaderboard for a competitive gaming or coding platform " +
      "that ranks millions of players by score. The system must support fetching the " +
      "global top-K players, looking up any player's rank instantly, and updating " +
      "scores in real time as players complete matches.",
    requirements: [
      "Update a player's score in real time after each game/match",
      "Retrieve the global top-K players with their scores and ranks (e.g., top 100)",
      "Look up a specific player's rank and nearby players (e.g., rank ± 5 context)",
      "Support scoped leaderboards: global, weekly, per-region, per-game-mode",
      "Display rank changes (delta) since last session",
      "Ensure scores are always consistent — no player should appear twice or be missing",
    ],
    constraints: [
      "10 million active players; 100 million total registered players",
      "Score updates: up to 50,000 writes/second during peak events",
      "Top-100 leaderboard reads: up to 500,000 reads/second",
      "Rank lookup for arbitrary player: < 5 ms (p99)",
      "Leaderboard must be eventually consistent within 1 second",
      "Weekly leaderboards reset every Monday at 00:00 UTC",
    ],
    hints: [
      "Redis has a built-in data structure designed exactly for ranked sets — what is it and what commands does it expose?",
      "ZADD, ZRANK, ZREVRANK, ZRANGE, ZREVRANGEBYSCORE — which Redis commands map to each leaderboard operation?",
      "How would you scope the leaderboard to a specific week without deleting and recreating the entire sorted set?",
      "What happens when a player improves their score — do you add to their existing score (ZINCRBY) or set a new absolute value (ZADD)?",
      "The top-100 list is read 500K times/second — should every read hit Redis, or can you add another caching layer?",
      "How would you handle 100 million total players when only 10 million are active — storing all 100M in Redis is expensive.",
    ],
    solution: {
      overview:
        "Use Redis Sorted Sets (ZSET) as the primary leaderboard store — ZADD for updates, " +
        "ZREVRANK for rank lookup, ZREVRANGE for top-K — all O(log N). " +
        "Namespace keys by scope and time window (e.g., lb:global:2026-W15). " +
        "Persist canonical scores in PostgreSQL for durability and historical queries. " +
        "A background sync job writes Redis scores to PostgreSQL every 30 seconds. " +
        "Cache the top-100 snapshot in a separate Redis key (plain string) refreshed every 2 seconds.",
      steps: [
        {
          step: "API Design",
          detail:
            "POST /scores { playerId, gameId, score } → 200 { newRank, delta }. " +
            "GET /leaderboard?scope=global&limit=100&offset=0 → [{ rank, playerId, username, score }]. " +
            "GET /leaderboard/player/{playerId}?context=5 → { rank, score, neighbours: [...±5] }. " +
            "GET /leaderboard/weekly → top-100 for current ISO week.",
        },
        {
          step: "Redis Sorted Set Design",
          detail:
            "Key pattern: lb:{scope}:{window} e.g. lb:global:2026-W15. " +
            "ZADD lb:global:2026-W15 NX|GT {score} {playerId}   (GT = only update if new score is higher). " +
            "ZREVRANK lb:global:2026-W15 {playerId}              → 0-indexed rank (add 1 for display). " +
            "ZREVRANGE lb:global:2026-W15 0 99 WITHSCORES        → top-100 with scores. " +
            "ZREVRANGEBYSCORE ... LIMIT offset count             → paginated leaderboard.",
        },
        {
          step: "Database Schema",
          detail:
            "Table player_scores: player_id UUID PK, username VARCHAR, global_score BIGINT, " +
            "weekly_score BIGINT, region VARCHAR(32), updated_at TIMESTAMPTZ. " +
            "Table score_history: id BIGSERIAL PK, player_id UUID, game_id UUID, score_delta INT, " +
            "recorded_at TIMESTAMPTZ. Used for audit and weekly reset computation.",
        },
        {
          step: "Weekly Reset",
          detail:
            "Cron job at Monday 00:00 UTC: create new Redis key lb:global:{new-week}. " +
            "Lazily populate — players enter the new week's ZSET on their first score update. " +
            "Old week key auto-expires via Redis TTL set to 8 days (preserves last week for 1 day). " +
            "Persist final weekly rankings to PostgreSQL leaderboard_snapshots table.",
        },
        {
          step: "Top-100 Snapshot Cache",
          detail:
            "Dedicated background job polls ZREVRANGE ... 0 99 every 2 seconds and writes the result " +
            "as a JSON string to Redis key lb:top100:global:{week} with TTL 3 s. " +
            "All GET /leaderboard?limit=100 requests read this snapshot key — avoids thundering herd on ZSET at 500K rps.",
        },
        {
          step: "Scaling Strategy",
          detail:
            "Redis Cluster: shard leaderboard keys by scope (global vs regional). " +
            "Read replicas for ZRANGE/ZREVRANK commands (read-only). " +
            "PostgreSQL for durable storage and historical analytics. " +
            "Only store active players in Redis (evict inactive players after 30-day TTL to save memory).",
        },
      ],
      tradeoffs: [
        {
          aspect: "Redis ZADD NX vs GT",
          tradeoff:
            "NX: only insert if player not present (ignores score updates). " +
            "GT: update only if new score is higher than current (correct for best-score leaderboards). " +
            "For cumulative scores (total XP), use ZINCRBY instead.",
        },
        {
          aspect: "Real-time vs Snapshot Leaderboard",
          tradeoff:
            "True real-time (every write immediately visible) is achievable with ZSET but expensive at 500K rps. " +
            "A 2-second snapshot cache reduces Redis reads by 99% with minimal perceived staleness.",
        },
        {
          aspect: "Memory vs Completeness",
          tradeoff:
            "Storing all 100 M players in Redis ZSET costs ~6 GB+ (each entry ~60 bytes). " +
            "Store only active players (10 M) in Redis → ~600 MB. Inactive players fall back to PostgreSQL rank query.",
        },
        {
          aspect: "Rank Precision",
          tradeoff:
            "ZREVRANK is O(log N) — fast even for 10 M entries. " +
            "Pagination via ZREVRANGE is O(log N + K) — fine for top-100. " +
            "Getting rank #5,000,050 out of 10 M is still fast (< 2 ms) in Redis.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Favour AP. A 1-second stale rank is acceptable for a gaming leaderboard. " +
            "Writes use Redis single-node operations (atomic per key) — no distributed transaction needed.",
        },
      ],
      diagram: {
        components: [
          "Game Server",
          "Score Update API",
          "Redis Cluster (ZSET per scope/week)",
          "Top-100 Snapshot Job (2s refresh)",
          "Leaderboard Read API",
          "PostgreSQL (canonical scores + history)",
          "Weekly Reset Cron",
        ],
        flow:
          "Score Update: Game Server → Score API → Redis ZADD GT {score} {playerId} → return new rank (ZREVRANK). " +
          "Top-100 Read: Client → Leaderboard API → Redis GET lb:top100:global:{week} (snapshot). " +
          "Player Rank Lookup: Client → Leaderboard API → Redis ZREVRANK → return rank + ZREVRANGE ±5 for context. " +
          "Persistence: async background job ZRANGE full set every 30 s → PostgreSQL upsert.",
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEDIUM
  // ══════════════════════════════════════════════════════════════════════════

  {
    title: "Design a Chat System (WhatsApp)",
    difficulty: "MEDIUM",
    description:
      "Design a real-time messaging platform supporting 1-on-1 and group chats, " +
      "similar to WhatsApp or Facebook Messenger. The system must deliver messages " +
      "within 100 ms for online users, guarantee at-least-once delivery for offline users, " +
      "and scale to 2 billion users exchanging 100 billion messages per day.",
    requirements: [
      "Send and receive 1-on-1 text messages in real time",
      "Support group chats with up to 1,000 members",
      "Show message delivery receipts: sent, delivered, read",
      "Display online/offline presence status for contacts",
      "Support multimedia messages (images, video, files) via URL attachments",
      "Persist message history — users can scroll back indefinitely",
      "Push notifications for offline users",
    ],
    constraints: [
      "2 billion registered users; 500 million daily active users",
      "100 billion messages/day → ~1.16 million messages/second",
      "Average message size: 100 bytes (text); up to 100 MB (media)",
      "Message delivery latency < 100 ms for online users (p99)",
      "Messages must never be lost (at-least-once delivery guarantee)",
      "Message history must be retained for minimum 1 year",
      "Presence updates must propagate within 5 seconds",
    ],
    hints: [
      "HTTP polling is too slow and resource-intensive for real-time chat — what transport protocol enables server-to-client push?",
      "When a user sends a message to a group of 1,000 members, how do you decide whether to fan out the message to all 1,000 at write time or pull it at read time?",
      "What database properties matter most for message storage — ACID transactions, or write throughput and time-series access patterns?",
      "How do you handle the case where a recipient is offline at message send time? Where do you queue the message?",
      "Presence (online/offline) is updated very frequently — storing it in a relational DB would be expensive. What is a better store?",
      "Media files should never go through the chat backend — what is the standard pattern for uploading and sharing large files in a messaging app?",
    ],
    solution: {
      overview:
        "Each connected client maintains a persistent WebSocket connection to a Chat Server. " +
        "A message from Alice → Bob flows: Alice's client → Chat Server (via WS) → Message Queue (Kafka) → " +
        "Chat Server holding Bob's connection → Bob's client. " +
        "If Bob is offline, the message is pulled from Cassandra by Bob's client when he reconnects. " +
        "Presence is tracked in Redis with a heartbeat TTL. Media is uploaded directly to S3 by clients via presigned URLs.",
      steps: [
        {
          step: "API Design",
          detail:
            "WebSocket: ws://chat.app/ws?token={jwt} — bidirectional, persistent per client session. " +
            "WS frames: { type: 'message', to: userId|groupId, body, clientMsgId, timestamp }. " +
            "REST: POST /upload/presign → { presignedUrl, mediaId } (for media). " +
            "POST /messages/ack { msgId, status: 'delivered'|'read' }. " +
            "GET /messages/{conversationId}?before={cursor}&limit=50 (history pagination).",
        },
        {
          step: "Message Flow",
          detail:
            "1. Alice sends WS frame to Chat Server A. " +
            "2. Chat Server A assigns a global message ID (Snowflake), writes to Kafka topic messages. " +
            "3. Message Fan-out Service consumes Kafka, looks up Bob's active Chat Server (from Redis service registry). " +
            "4. If Bob is online: Fan-out Service pushes to Bob's Chat Server B via internal gRPC → WS frame to Bob. " +
            "5. Chat Server also writes message to Cassandra (async, within 200 ms) for persistence. " +
            "6. If Bob is offline: Push Notification Service sends APNS/FCM push.",
        },
        {
          step: "Database Schema (Cassandra)",
          detail:
            "Table messages: partition key = conversation_id (for co-location), " +
            "clustering key = message_id DESC (time-sorted, newest first). " +
            "Columns: sender_id, body, media_url, status, created_at. " +
            "Table conversations: user_id (partition), conversation_id, last_message, last_active. " +
            "Cassandra chosen for: time-series write throughput, wide-row reads for history, horizontal scale.",
        },
        {
          step: "Presence System",
          detail:
            "Client sends heartbeat WebSocket ping every 10 seconds. " +
            "Chat Server sets Redis key presence:{userId} = { status: 'online', serverId } with TTL 30 s. " +
            "On key expiry → user considered offline. " +
            "Presence change events published to Kafka topic presence → Fan-out Service notifies contacts.",
        },
        {
          step: "Group Messaging",
          detail:
            "Groups ≤ 500 members: fan-out on write (Fan-out Service loops through member list and delivers). " +
            "Groups > 500 members: fan-out on read (message stored once; each member client pulls on connect). " +
            "Group member list cached in Redis (TTL 5 min) to avoid DB lookups on every message.",
        },
        {
          step: "Media Upload",
          detail:
            "Client requests presigned S3 URL from Media Service. " +
            "Client uploads directly to S3 (bypasses chat backend). " +
            "Client sends chat message with { media_url: 'https://cdn.chat.app/media/{id}' }. " +
            "CDN (CloudFront) serves media at edge. Virus scan runs async via S3 event + Lambda.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Fan-out on Write vs Read (Groups)",
          tradeoff:
            "Fan-out on write: low read latency, high write amplification (O(members) writes per message). " +
            "Fan-out on read: single write, high read latency for large groups. " +
            "Hybrid threshold (500 members) balances both.",
        },
        {
          aspect: "Cassandra vs PostgreSQL for Messages",
          tradeoff:
            "Cassandra: excellent write throughput, natural time-series partitioning, tunable consistency. " +
            "PostgreSQL: ACID but write bottleneck at 1M msg/s scale. " +
            "Cassandra wins for append-only message logs with known access patterns.",
        },
        {
          aspect: "WebSocket vs Long Polling vs SSE",
          tradeoff:
            "WebSocket: bidirectional, low overhead, best for chat. " +
            "Long polling: works through firewalls but adds latency. " +
            "SSE: server-to-client only, not bidirectional. " +
            "WebSocket is the industry standard for real-time chat.",
        },
        {
          aspect: "At-Least-Once vs Exactly-Once Delivery",
          tradeoff:
            "Exactly-once is expensive (two-phase commit). " +
            "At-least-once with idempotent message IDs (clientMsgId deduplication on receipt) is standard. " +
            "Clients deduplicate by clientMsgId before displaying.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Message storage: favour CP (consistency over availability) — losing a message is worse than a brief delay. " +
            "Presence: favour AP — a slightly stale online indicator is acceptable.",
        },
      ],
      diagram: {
        components: [
          "Mobile Client",
          "Load Balancer (Layer 7, sticky sessions)",
          "Chat Server Fleet (WebSocket, stateful)",
          "Kafka (messages topic, presence topic)",
          "Message Fan-out Service",
          "Push Notification Service (APNS/FCM)",
          "Redis (presence registry, server registry)",
          "Cassandra (message persistence)",
          "S3 + CDN (media)",
          "Media Service (presign API)",
        ],
        flow:
          "Send: Client A → WS → Chat Server A → Kafka (messages). " +
          "Fan-out: Kafka Consumer → lookup recipient server in Redis → gRPC push to Chat Server B → WS to Client B. " +
          "Offline: Fan-out Service → Push Notification Service → APNS/FCM. " +
          "History: Client reconnects → REST GET /messages/{convId} → Cassandra read.",
      },
    },
  },

  {
    title: "Design a Notification System",
    difficulty: "MEDIUM",
    description:
      "Design a multi-channel notification delivery system that sends notifications " +
      "to users via push (iOS/Android), email, and SMS. The system must handle " +
      "tens of millions of notifications per day, support user-level preferences, " +
      "ensure reliable delivery with retry logic, and never send duplicate notifications.",
    requirements: [
      "Send notifications through at least three channels: push (APNS/FCM), email (SMTP/SES), SMS (Twilio/SNS)",
      "Respect per-user channel preferences (e.g., user disabled email notifications)",
      "Support notification templates with variable substitution (e.g., 'Hi {{name}}, your order {{orderId}} shipped')",
      "Guarantee at-least-once delivery with automatic retry on transient failures",
      "Prevent duplicate notifications via idempotency checks",
      "Support scheduled notifications (send at a future time) and immediate notifications",
      "Provide a delivery status API for producers to track notification state",
    ],
    constraints: [
      "50 million notifications/day across all channels",
      "Peak: 500,000 notifications/minute during flash sales or breaking news events",
      "End-to-end delivery < 5 seconds for immediate notifications",
      "Retry up to 3 times with exponential back-off (1 s, 4 s, 16 s) before marking as failed",
      "Third-party provider rate limits: FCM 1M/min, APNS 1M/min, SES 1M/day (paid tier), Twilio 1M SMS/day",
      "Audit log of every notification sent (channel, status, timestamp) retained for 90 days",
    ],
    hints: [
      "Notification producers (order service, auth service, etc.) should not know about delivery details — what pattern decouples them from the notification system?",
      "Multiple worker instances consuming the same notification could cause duplicates — how do you prevent this?",
      "Different channels have very different throughput characteristics (email vs SMS vs push) — should they share a single queue or have separate queues?",
      "A transient FCM error should retry, but a permanently invalid device token should not — how do you distinguish them?",
      "How would you implement 'send at 9 AM in the user's local timezone' for 10 million users efficiently?",
      "A single marketing blast going out to 10 million users at once would spike the queue — how do you shape or throttle that traffic?",
    ],
    solution: {
      overview:
        "Event-driven architecture: upstream services publish notification events to a Kafka topic. " +
        "A Notification Router service consumes events, resolves user preferences and device tokens, " +
        "renders templates, then dispatches to per-channel worker queues (push queue, email queue, SMS queue). " +
        "Channel workers handle delivery, retry with exponential back-off, and write status updates to PostgreSQL. " +
        "Idempotency is enforced via a deduplication key stored in Redis.",
      steps: [
        {
          step: "API Design",
          detail:
            "POST /notifications { eventType, userId, templateId, variables, channel?, scheduledAt? } → 202 { notificationId }. " +
            "GET /notifications/{id} → { id, status, channel, deliveredAt, failureReason }. " +
            "POST /preferences { userId, channel, enabled } → 200. " +
            "Internal (service-to-service): Kafka event notification.requested with schema { eventId, userId, templateId, vars, priority }.",
        },
        {
          step: "Notification Router",
          detail:
            "Consumes Kafka topic notification.requested. For each event: " +
            "1. Check Redis dedup key notif:{eventId}:{userId} — if exists, skip (TTL 24 h). " +
            "2. Load user preferences from cache (Redis) or DB. " +
            "3. Resolve device tokens (FCM/APNS) from device registry. " +
            "4. Render template (Handlebars/Jinja). " +
            "5. Enqueue one message per channel to push-queue / email-queue / sms-queue (separate Kafka topics or SQS queues).",
        },
        {
          step: "Database Schema",
          detail:
            "Table notifications: id UUID PK, user_id UUID, event_type VARCHAR, channel ENUM, template_id UUID, " +
            "status ENUM(pending,sent,delivered,failed), provider_message_id VARCHAR, scheduled_at TIMESTAMPTZ, " +
            "sent_at TIMESTAMPTZ, failure_reason TEXT, created_at TIMESTAMPTZ. " +
            "Table templates: id UUID PK, name VARCHAR UNIQUE, subject TEXT, body_template TEXT, channels VARCHAR[]. " +
            "Table device_tokens: user_id UUID, platform ENUM(ios,android), token TEXT, active BOOLEAN.",
        },
        {
          step: "Channel Workers",
          detail:
            "Separate worker pools per channel — each worker consumes from its channel queue. " +
            "Push Worker: calls FCM/APNS batch API (up to 500 tokens per call). " +
            "Email Worker: calls AWS SES SendBulkTemplatedEmail. " +
            "SMS Worker: calls Twilio Messages API. " +
            "On 4xx permanent error (invalid token): mark device as inactive, do not retry. " +
            "On 5xx/network error: exponential back-off retry (1 s, 4 s, 16 s), then DLQ after 3 failures.",
        },
        {
          step: "Scheduled Notifications",
          detail:
            "Scheduler service polls PostgreSQL for notifications WHERE scheduled_at BETWEEN now() AND now() + interval '60 seconds' " +
            "every 30 seconds. Enqueues matching events to the router queue. " +
            "For timezone-aware sends (e.g., 9 AM local): convert user timezone to UTC at scheduling time.",
        },
        {
          step: "Traffic Shaping",
          detail:
            "Marketing blasts use a low-priority Kafka partition with rate-limited consumers (token bucket, 100K msgs/min). " +
            "Transactional notifications (OTP, order confirmations) use a high-priority partition with full throughput. " +
            "Priority queue separation ensures OTPs are never delayed by bulk campaigns.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Shared Queue vs Per-Channel Queues",
          tradeoff:
            "Shared queue: simpler, but a slow SMS provider backs up push notifications. " +
            "Per-channel queues: isolation — a Twilio outage does not affect FCM. " +
            "Per-channel is the correct choice at scale.",
        },
        {
          aspect: "At-Least-Once vs Exactly-Once Delivery",
          tradeoff:
            "Kafka + idempotency key in Redis provides at-least-once with practical deduplication. " +
            "True exactly-once requires distributed transactions — too expensive for notification workloads.",
        },
        {
          aspect: "Template Rendering Location",
          tradeoff:
            "Render at router time (before queuing): rendered content is durable in the queue. " +
            "Render at delivery time (in channel worker): smaller queue payloads but template changes can affect in-flight messages. " +
            "Render at router time is safer for consistency.",
        },
        {
          aspect: "Third-Party Provider Dependency",
          tradeoff:
            "Single provider per channel: simpler but single point of failure. " +
            "Multi-provider with fallback (FCM → SMS if push fails): resilient but complex routing logic. " +
            "Implement provider abstraction layer to swap vendors without code changes.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Favour AP for push notifications (eventual delivery acceptable). " +
            "Favour CP for OTP/auth notifications — delayed delivery is better than double-sending a login code.",
        },
      ],
      diagram: {
        components: [
          "Upstream Services (Order, Auth, Marketing)",
          "Kafka (notification.requested topic)",
          "Notification Router",
          "Redis (dedup keys, user prefs cache)",
          "PostgreSQL (notifications, templates, device_tokens)",
          "Push Queue (Kafka/SQS)",
          "Email Queue",
          "SMS Queue",
          "Push Worker (FCM/APNS)",
          "Email Worker (SES)",
          "SMS Worker (Twilio)",
          "Dead Letter Queue",
          "Scheduler Service",
        ],
        flow:
          "Upstream → Kafka notification.requested → Router (dedup check + preference resolve + template render) " +
          "→ per-channel queues → Channel Workers → third-party providers → status write to PostgreSQL. " +
          "Failed after 3 retries → DLQ → alert + manual review.",
      },
    },
  },

  {
    title: "Design a Search Autocomplete System",
    difficulty: "MEDIUM",
    description:
      "Design the type-ahead / autocomplete feature for a large-scale search engine " +
      "like Google Search. As a user types each character into the search box, the " +
      "system must return the top 5–10 most popular completions for the current prefix " +
      "within 50 ms — even under billions of daily queries.",
    requirements: [
      "Return top-K (default 5) autocomplete suggestions for a given prefix as the user types",
      "Suggestions must be ranked by historical search popularity (query frequency)",
      "System must handle prefix queries in real time — no full-table scan per keystroke",
      "Update suggestion rankings daily as new search trends emerge",
      "Support filtering suggestions by region or language",
      "Suggest only safe/non-offensive completions (support a blocklist)",
    ],
    constraints: [
      "10 billion search queries/day → 115K queries/second average",
      "Autocomplete fires on every keystroke — 5 keystrokes per query average → 575K autocomplete requests/second",
      "Suggestion latency < 50 ms at p99 (including network round trip)",
      "Top-K query vocabulary: ~10 million unique popular prefixes",
      "Daily trie rebuild from query logs must complete within 1 hour",
      "System must serve stale suggestions gracefully if trie rebuild is in progress",
    ],
    hints: [
      "A Trie data structure maps prefix searches to completions in O(P + K) time where P is prefix length — how would you store the top-K completions at each trie node to avoid full subtree traversals?",
      "Building the trie in memory on a single server works for small vocabularies — how do you distribute it for 10 million prefixes across multiple servers?",
      "The full trie is rebuilt daily from search logs — how do you serve traffic without downtime during the rebuild?",
      "What is the access pattern for autocomplete? Are short prefixes (2–3 chars) much more common than long ones?",
      "Since short prefixes ('ap', 'ap') map to the same top-K every time, what simple optimisation eliminates most DB/trie lookups?",
      "How would you incorporate real-time trending queries (last 1 hour) alongside the daily-updated base trie?",
    ],
    solution: {
      overview:
        "Offline pipeline: aggregate query logs daily with MapReduce/Spark to compute top-K completions per prefix. " +
        "Store the prefix→top-K mapping in a distributed trie (or simply a Redis hash for the top 99% of prefixes). " +
        "Serve autocomplete from a read-through Redis cache backed by a trie service. " +
        "Short prefixes (≤ 4 chars) cover most traffic and are served entirely from a warm Redis cache. " +
        "Trie is blue-green deployed to avoid downtime during daily rebuilds.",
      steps: [
        {
          step: "API Design",
          detail:
            "GET /autocomplete?q={prefix}&limit=5&region=US → { suggestions: ['apple', 'apple watch', ...] }. " +
            "Stateless REST endpoint — no session state. " +
            "Browser-side: debounce on 100 ms, minimum 2 characters before firing.",
        },
        {
          step: "Offline Trie Build Pipeline",
          detail:
            "Input: raw query log (Kafka → S3, ~500 GB/day). " +
            "Spark job: 1) filter blocked queries, 2) count frequency per (query, date), " +
            "3) apply 7-day weighted decay (recent queries count more), " +
            "4) for each prefix of each popular query, record the query and its score, " +
            "5) group by prefix, keep top-10 by score. " +
            "Output: prefix → [{ query, score }]  serialised to Parquet, then loaded into Redis.",
        },
        {
          step: "Data Store: Redis vs Trie Service",
          detail:
            "Redis Sorted Set per prefix: key = ac:{region}:{prefix}, members = query strings, scores = popularity. " +
            "ZREVRANGEBYSCORE ac:US:appl 0 99 LIMIT 0 5 → top-5 in < 1 ms. " +
            "Total keys: ~10 M prefixes × 2 regions = 20 M Redis keys → ~20 GB RAM. Acceptable. " +
            "For long-tail prefixes not in Redis: fall back to a Trie Service (in-process Go/Rust trie in memory).",
        },
        {
          step: "Caching Strategy",
          detail:
            "L1: browser-side LRU cache (last 50 prefix→result pairs). " +
            "L2: CDN (Fastly/CloudFront) caches GET /autocomplete?q=appl → TTL 60 s (high cache-hit for popular prefixes). " +
            "L3: Redis (primary source, rebuilt daily). " +
            "This 3-layer cache means Redis handles < 5% of total autocomplete QPS.",
        },
        {
          step: "Blue-Green Trie Deployment",
          detail:
            "Maintain two Redis keyspaces: ac-blue and ac-green (or two Redis clusters). " +
            "Daily rebuild writes to the inactive slot. " +
            "After build completes and passes spot-check validation, a feature flag atomically switches all " +
            "autocomplete servers to read from the new slot. " +
            "Old slot retained for 24 h as rollback target.",
        },
        {
          step: "Real-Time Trending",
          detail:
            "Separate Trending Service counts queries in a 1-hour tumbling window (Redis INCR with 1-h TTL). " +
            "Top-10 trending terms are merged into autocomplete results at response time: " +
            "if a trending query matches the prefix and has 10x baseline traffic spike, prepend it to suggestions. " +
            "Avoids rebuilding the full daily trie for breaking news queries.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Trie in Memory vs Redis ZSET",
          tradeoff:
            "In-memory Trie: O(P) lookup, no network, supports arbitrary prefix traversal. But complex to distribute and update. " +
            "Redis ZSET: O(log N) lookup, network hop (~1 ms local), trivially distributed and updated. " +
            "Redis ZSET wins for top-10M prefixes; in-memory trie as fallback for long tail.",
        },
        {
          aspect: "Offline Build vs Real-Time Update",
          tradeoff:
            "Offline daily rebuild: simple, catches trends within 24 h, no write contention on serving Redis. " +
            "Real-time streaming update (Flink → Redis): fresher but complex, risk of serving unstable intermediate results. " +
            "Hybrid: daily rebuild + real-time trending overlay.",
        },
        {
          aspect: "Prefix Depth",
          tradeoff:
            "Storing suggestions for every prefix of every popular query is expensive (O(avg_query_length × vocab_size)). " +
            "Cap at prefix length 15 — beyond that, the query is specific enough that full-text search is better.",
        },
        {
          aspect: "Personalisation",
          tradeoff:
            "Global suggestions are cheap (shared cache). Personalised suggestions (based on user history) " +
            "require per-user computation and cannot be CDN-cached. " +
            "Blend: 80% global top-K + 20% personal history, applied client-side to preserve cache efficiency.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Favour AP. Serving slightly stale (yesterday's) autocomplete suggestions during a trie rebuild " +
            "is perfectly acceptable. Users barely notice 24-hour staleness in suggestions.",
        },
      ],
      diagram: {
        components: [
          "Browser (debounce, L1 cache)",
          "CDN (L2 cache, 60 s TTL)",
          "Autocomplete API Service",
          "Redis Cluster (prefix → ZSET of top-K suggestions)",
          "Trie Service (long-tail fallback)",
          "Trending Service (1-h rolling window)",
          "Spark Build Pipeline (daily, reads query logs from S3)",
          "S3 (query logs from Kafka sink)",
        ],
        flow:
          "User types 'appl' → browser L1 cache miss → CDN miss → Autocomplete API " +
          "→ Redis ZREVRANGEBYSCORE ac:US:appl → merge with Trending Service top queries " +
          "→ return top-5 to browser. " +
          "Daily: Kafka → S3 → Spark → Redis ac-green rebuild → feature flag flip to green.",
      },
    },
  },

  {
    title: "Design a Web Crawler",
    difficulty: "MEDIUM",
    description:
      "Design a distributed web crawler that systematically browses the World Wide Web, " +
      "downloads web pages, extracts links, and stores page content for a search engine index. " +
      "The crawler must be polite (respect robots.txt and crawl-delay), handle duplicates, " +
      "and scale to crawl billions of pages within days.",
    requirements: [
      "Crawl web pages starting from a seed URL list; extract and follow outgoing links",
      "Respect robots.txt disallow rules and Crawl-Delay directives for every domain",
      "Detect and skip duplicate URLs (already crawled) and near-duplicate content",
      "Store raw HTML, extracted links, and metadata (status code, content type, crawl time)",
      "Support priority crawling — high-authority domains crawled more frequently",
      "Handle JavaScript-rendered pages (optional: headless browser for JS-heavy sites)",
    ],
    constraints: [
      "Target: 1 billion pages crawled in 7 days → ~1,650 pages/second",
      "Average page size: 100 KB → total raw storage ~100 TB",
      "URL frontier: up to 10 billion URLs in the queue at peak",
      "Politeness: no more than 1 request per domain every 5 seconds",
      "DNS lookups are a bottleneck — cache DNS responses aggressively",
      "Crawl budget: re-crawl popular pages every 7 days, others every 30 days",
    ],
    hints: [
      "The URL frontier (queue of URLs to crawl) must be prioritised and also enforce politeness — how do you architect a queue that satisfies both?",
      "With 10 billion URLs in the frontier, how do you efficiently check whether a URL has already been seen without loading all URLs into memory?",
      "robots.txt must be fetched and obeyed per domain — how do you avoid fetching robots.txt on every single request to the same domain?",
      "A single crawler hitting the same domain too fast will get rate-limited or IP-banned — how do you distribute crawl workers so each domain gets polite treatment?",
      "Page content deduplication (near-duplicate detection) is more complex than URL deduplication — what hashing technique is used for this?",
      "How do you decide which URLs to re-crawl and how often, given limited crawl budget?",
    ],
    solution: {
      overview:
        "Multi-component distributed crawler: URL Frontier (priority queue + per-domain back queues for politeness), " +
        "Fetcher workers (download HTML), Parser workers (extract links + metadata), " +
        "URL Seen Filter (Bloom filter + Redis), Content Dedup Filter (SimHash), and Storage (S3 for raw HTML, Cassandra for metadata). " +
        "Consistent hashing assigns each domain to a single Fetcher worker group — ensuring per-domain rate limits are enforced centrally.",
      steps: [
        {
          step: "URL Frontier Design",
          detail:
            "Two-tier queue: Front Queues (priority tiers: high/medium/low based on domain authority) " +
            "and Back Queues (one per domain, enforces crawl-delay). " +
            "Queue Router picks the next URL from a back queue whose domain's last-crawl-time + crawl_delay ≤ now(). " +
            "Back queues stored in Redis (sorted sets keyed by domain, scored by earliest_crawl_time). " +
            "Front queues stored in Kafka (partitioned by priority) for durability.",
        },
        {
          step: "Deduplication: URL Seen Filter",
          detail:
            "Bloom filter (1 billion URLs → ~1.2 GB at 1% false-positive rate) for fast in-memory check. " +
            "On Bloom filter positive: confirm against Redis set url:seen:{hash} to resolve false positives. " +
            "URL normalisation before hashing: lowercase, strip tracking params (?utm_*), resolve relative URLs.",
        },
        {
          step: "Fetcher Workers",
          detail:
            "Pull next URL from frontier. Check robots.txt cache (Redis, TTL 24 h) — skip if disallowed. " +
            "Perform DNS lookup (local cache with 1-hour TTL). HTTP GET with 5 s timeout, follow up to 5 redirects. " +
            "On success: push { url, html, headers, status, timestamp } to parse-queue (Kafka). " +
            "On 4xx: mark URL as dead. On 5xx/timeout: exponential back-off retry (max 3 attempts).",
        },
        {
          step: "Parser Workers",
          detail:
            "Consume parse-queue. Extract: outgoing links (absolute URL after normalisation), " +
            "title, meta description, language, canonical URL. " +
            "Content dedup: compute SimHash of visible text — if Hamming distance ≤ 3 from existing SimHash → near-duplicate, skip storage. " +
            "New URLs: check Bloom filter → if unseen, push to URL frontier with priority score.",
        },
        {
          step: "Storage",
          detail:
            "Raw HTML: S3 at key crawl/{domain}/{urlHash}/{crawlDate}.html.gz (Gzip compressed, ~30% of original size). " +
            "Metadata: Cassandra table crawl_metadata (partition key = domain, clustering = crawl_date DESC, columns = url, status, content_hash, simhash, title). " +
            "Re-crawl schedule: update next_crawl_at = now() + crawl_interval based on content change rate.",
        },
        {
          step: "Distributed Assignment",
          detail:
            "Consistent hashing maps domain → Fetcher worker group (prevents two groups crawling the same domain). " +
            "If a Fetcher node dies, its domains are redistributed to remaining nodes via consistent hash ring. " +
            "Crawl coordinator (ZooKeeper or etcd) manages worker registration and failure detection.",
        },
      ],
      tradeoffs: [
        {
          aspect: "BFS vs Priority-Based Crawling",
          tradeoff:
            "Pure BFS crawls the web breadth-first but wastes budget on low-quality pages. " +
            "Priority-based crawling (high PageRank domains first) discovers more valuable content faster. " +
            "Priority crawling is the industry standard (Google, Bing use link-graph signals).",
        },
        {
          aspect: "Bloom Filter Accuracy",
          tradeoff:
            "1% false-positive rate means ~10M of 1B URLs are wrongly skipped. Acceptable for a crawler. " +
            "Reducing to 0.1% doubles memory requirement. " +
            "Bloom filter never has false negatives — a URL it says is unseen is always unseen.",
        },
        {
          aspect: "In-Process Parsing vs Separate Workers",
          tradeoff:
            "In-process: lower latency. Parsing can be slow (large HTML pages) and would block the fetcher. " +
            "Separate parser workers via Kafka: fetchers run at maximum throughput, parsing scales independently.",
        },
        {
          aspect: "JavaScript Rendering",
          tradeoff:
            "Headless Chrome (Puppeteer) can render JS-heavy pages but uses 10x more CPU/memory and is 10x slower. " +
            "Crawl JS pages only for high-priority domains; use raw HTML for the rest.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Favour AP. A crawler that temporarily re-crawls a page due to Bloom filter inconsistency is fine. " +
            "Availability (keep crawling) is more important than perfect deduplication consistency.",
        },
      ],
      diagram: {
        components: [
          "Seed URL List",
          "URL Frontier (Kafka priority queues + Redis back queues per domain)",
          "Fetcher Workers (N machines, domain-affinity via consistent hashing)",
          "robots.txt Cache (Redis)",
          "DNS Cache (local per-worker)",
          "Parse Queue (Kafka)",
          "Parser Workers",
          "Bloom Filter + Redis URL Seen Filter",
          "SimHash Dedup Store",
          "S3 (raw HTML)",
          "Cassandra (crawl metadata)",
          "Crawl Coordinator (ZooKeeper)",
        ],
        flow:
          "Seed → URL Frontier → Fetcher (robots check, DNS, HTTP GET) → parse-queue (Kafka) " +
          "→ Parser (extract links, SimHash dedup) → new URLs → Bloom filter check → URL Frontier. " +
          "Fetched content → S3 (raw) + Cassandra (metadata).",
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HARD
  // ══════════════════════════════════════════════════════════════════════════

  {
    title: "Design Twitter / X",
    difficulty: "HARD",
    description:
      "Design a social media platform like Twitter/X where users can post short messages " +
      "(tweets, up to 280 chars), follow other users, view a personalised home timeline, " +
      "and see global trending topics. The system must handle hundreds of millions of users " +
      "and support sub-second timeline loads even for users who follow thousands of accounts.",
    requirements: [
      "Post a tweet (text, images, video, polls) — up to 280 characters",
      "Follow and unfollow users; follower/following counts must be accurate",
      "Home timeline: personalised feed of tweets from accounts the user follows, newest first",
      "Search tweets by keyword, hashtag, and user mention",
      "Trending topics: global and geo-localised, updated every 15 minutes",
      "Like, retweet, and reply to tweets",
      "Push notifications for mentions, likes, and new followers",
    ],
    constraints: [
      "300 million monthly active users; 100 million daily active users",
      "500 million tweets/day → ~5,800 tweets/second",
      "Home timeline load < 200 ms (p99)",
      "Follow graph: average user follows 200 accounts; celebrity users have up to 100 million followers",
      "Read-heavy: 1,000:1 read-to-write ratio for timelines",
      "Tweets must be retrievable for at least 5 years",
      "Trending topics must reflect real-time signal within 15 minutes",
    ],
    hints: [
      "When Alice posts a tweet and has 1 million followers, do you push that tweet into 1 million follower inboxes immediately (fan-out on write), or do you merge all timelines lazily at read time (fan-out on read)?",
      "Fan-out on write is fast for reads but causes massive write amplification for celebrities with millions of followers — what hybrid approach does Twitter actually use?",
      "A user's home timeline is essentially a merge of sorted tweet streams from all followed accounts — what data structure efficiently holds a pre-computed timeline in memory?",
      "Tweets are immutable once posted (aside from deletion) — how does this property simplify caching?",
      "Trending topics require counting hashtag mentions across 500 million tweets/day in near-real-time — what streaming processing framework is appropriate?",
      "The follow graph has a heavy-tailed distribution (most users have few followers, a few have hundreds of millions) — how does this distribution drive your architecture decisions?",
    ],
    solution: {
      overview:
        "Hybrid fan-out model: fan-out on write for regular users (≤ 5,000 followers), " +
        "fan-out on read for celebrities (> 5,000 followers). " +
        "Home timelines are pre-computed and cached in Redis as sorted sets of tweet IDs. " +
        "On timeline read, inject celebrity tweets from a separate 'celebrity feed' in-memory at read time. " +
        "Tweets stored in Cassandra. Follow graph in a dedicated Graph Service. " +
        "Trending topics computed by Apache Flink on the Kafka tweet stream.",
      steps: [
        {
          step: "API Design",
          detail:
            "POST /tweets { text, mediaIds?, replyTo?, quoteTweetId? } → 201 { tweetId }. " +
            "GET /timeline/home?cursor={id}&limit=20 → { tweets: [...], nextCursor }. " +
            "POST /users/{id}/follow → 200. " +
            "GET /trends?geo=US → [{ hashtag, tweetCount, rank }]. " +
            "GET /search?q={keyword}&type=tweets|users → paginated results. " +
            "All reads served from cache; cursor-based pagination (not offset) for timeline.",
        },
        {
          step: "Tweet Storage (Cassandra)",
          detail:
            "Table tweets: partition key = user_id (collocate a user's tweets), " +
            "clustering key = tweet_id DESC (Snowflake, time-sorted). " +
            "Columns: text, media_ids[], like_count, retweet_count, reply_count, created_at. " +
            "tweet_id is a Snowflake ID — embeds timestamp, so time-range queries need no secondary index. " +
            "Counters (likes) updated via Cassandra counter columns to avoid read-modify-write races.",
        },
        {
          step: "Timeline Fan-out (Hybrid)",
          detail:
            "On tweet creation: Fan-out Service consumes Kafka topic tweets. " +
            "For user with ≤ 5K followers: ZADD timeline:{followerId} {tweetId} {tweetId} for each follower " +
            "(score = tweet_id / Snowflake timestamp). Cap timeline at 800 entries (trim oldest). " +
            "For celebrity (> 5K followers): do NOT fan out. " +
            "On timeline read: merge user's precomputed Redis timeline + lazy-fetched recent tweets " +
            "from each celebrity they follow (last 20 tweets per celebrity from Cassandra). " +
            "Sort + deduplicate merged list in application layer.",
        },
        {
          step: "Timeline Cache (Redis)",
          detail:
            "Redis sorted set: key = timeline:{userId}, score = tweet_id (Snowflake), member = tweet_id. " +
            "ZREVRANGEBYSCORE for pagination (cursor = last seen tweet_id). " +
            "On cache miss (first load or eviction): hydrate from Cassandra by querying each followed user's tweets. " +
            "TTL: 24 h (inactive user timelines evicted). " +
            "Tweet objects cached separately: hash tweet:{tweetId} → { text, author, media, counts }.",
        },
        {
          step: "Follow Graph",
          detail:
            "Dedicated Graph Service backed by a graph DB or denormalised SQL. " +
            "MySQL table follows: (follower_id, followee_id, created_at) — composite PK, indexed both ways. " +
            "Follower/following counts in Redis (INCR on follow). " +
            "For fan-out: Fan-out Service queries Graph Service for follower list in batches of 1,000.",
        },
        {
          step: "Trending Topics",
          detail:
            "Kafka tweet stream → Flink sliding window (15-min window, 1-min slide) counting hashtag occurrences by geo. " +
            "Top-50 per region written to Redis key trends:{region} with TTL 20 min every minute. " +
            "Trending API reads directly from Redis. " +
            "Spike detection: compare current window count to 7-day baseline — 3x spike triggers 'trending' badge.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Fan-out on Write vs Read",
          tradeoff:
            "Fan-out on write: O(followers) writes per tweet. Fast reads (precomputed). " +
            "Problematic for celebrities (100M followers = 100M Redis writes per tweet). " +
            "Fan-out on read: O(1) writes, slow reads (merge N streams). " +
            "Hybrid (threshold ~5K followers) is the industry-standard solution (used by Twitter/Instagram).",
        },
        {
          aspect: "Cassandra vs MySQL for Tweets",
          tradeoff:
            "Cassandra: linear horizontal scale, excellent append throughput, time-series access pattern. " +
            "MySQL: ACID, but write bottleneck at 5,800 tweets/s with full ACID compliance. " +
            "Cassandra wins for the tweet object store; MySQL used for the follow graph (relational, lower volume).",
        },
        {
          aspect: "Timeline Cache Size",
          tradeoff:
            "Capping timeline at 800 entries saves memory but means older tweets require a Cassandra read. " +
            "Most users never scroll past 200 tweets — 800 is an empirical sweet spot used by Twitter.",
        },
        {
          aspect: "Search",
          tradeoff:
            "Cassandra does not support full-text search. " +
            "Tweets are indexed asynchronously in Elasticsearch via a Kafka consumer. " +
            "Search queries hit Elasticsearch; display fetches full tweet from cache/Cassandra by tweet ID.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Favour AP for timelines — seeing a tweet 1 second late is acceptable. " +
            "Favour CP for follow counts and like counts — inaccurate social proof metrics erode trust. " +
            "Use Redis atomic INCR for counts (single-node consistency within a shard).",
        },
      ],
      diagram: {
        components: [
          "Mobile/Web Client",
          "API Gateway",
          "Tweet Service",
          "Kafka (tweets topic)",
          "Fan-out Service",
          "Graph Service (follows)",
          "Redis (timeline sorted sets, tweet objects, counts, trends)",
          "Cassandra (tweet storage)",
          "Elasticsearch (full-text search index)",
          "Flink (trending computation)",
          "Media Service + S3 + CDN",
          "Notification Service",
        ],
        flow:
          "Post tweet: Client → API GW → Tweet Service → Cassandra + Kafka. " +
          "Fan-out: Kafka → Fan-out Service → Graph Service (follower list) → Redis ZADD per follower. " +
          "Read timeline: Client → Timeline Service → Redis ZREVRANGE + merge celebrity tweets → return tweet objects. " +
          "Trending: Kafka → Flink → Redis trends:{region}.",
      },
    },
  },

  {
    title: "Design YouTube",
    difficulty: "HARD",
    description:
      "Design a video streaming platform like YouTube that supports uploading, " +
      "transcoding, storing, and streaming videos to billions of users worldwide. " +
      "The system must handle uploads of large raw video files, process them into " +
      "multiple resolutions, and deliver smooth adaptive-bitrate streams globally " +
      "with high availability.",
    requirements: [
      "Upload videos of up to 12 hours / 128 GB in raw format",
      "Transcode uploaded videos into multiple resolutions (360p, 480p, 720p, 1080p, 4K)",
      "Stream videos with adaptive bitrate (ABR) — client switches quality based on bandwidth",
      "Support resume-on-failure for uploads (chunked upload protocol)",
      "Store and serve video thumbnails and metadata (title, description, tags, duration)",
      "Provide a personalised home feed and search by title/tag",
      "Track view counts, likes, comments",
    ],
    constraints: [
      "2 billion logged-in users; 500 hours of video uploaded every minute",
      "Video views: 1 billion hours watched per day → ~700K concurrent streams",
      "Upload bandwidth: 500 hrs × 60 min × ~1 Gbps raw ≈ massive; average raw upload 1 GB/min",
      "Transcoding must complete within 10 minutes for videos ≤ 30 minutes",
      "Video streaming latency (first frame): < 2 seconds globally (p95)",
      "Storage: ~1 exabyte total (all qualities, all videos)",
      "CDN must serve 99.9% of stream bandwidth",
    ],
    hints: [
      "Uploading a 10 GB raw video file as a single HTTP request is unreliable — what upload protocol handles network interruptions gracefully?",
      "Transcoding a 2-hour video into 5 resolutions is CPU-intensive and can take hours on one machine — how do you parallelise this?",
      "How does YouTube's streaming protocol (HLS/DASH) allow a player to seamlessly switch from 1080p to 360p when the user's bandwidth drops?",
      "With 700K concurrent streams, serving all video traffic from an origin server is impossible — what infrastructure layer handles the bulk of stream delivery?",
      "Video views must be counted accurately (to prevent fraud) but also at massive scale — would you count every single view synchronously in a SQL database?",
      "What is the difference between the metadata service (video title, tags, channels) and the video storage service — and why should they be separate?",
    ],
    solution: {
      overview:
        "Three-phase pipeline: Upload → Transcode → Serve. " +
        "Uploads use TUS (resumable upload protocol) to an Upload Service that writes raw video to S3. " +
        "An S3 event triggers the Transcoding Pipeline (message queue + worker fleet). " +
        "Workers segment video into HLS/DASH chunks per resolution and write to S3/CDN origin. " +
        "CDN (CloudFront/Akamai) caches and delivers > 99% of stream traffic. " +
        "Metadata in PostgreSQL, view counts in Redis with periodic flush to PostgreSQL.",
      steps: [
        {
          step: "API Design",
          detail:
            "POST /uploads/initiate { filename, size, contentType } → { uploadId, uploadUrl } (presigned multipart S3 URL). " +
            "PUT /uploads/{uploadId}/chunk/{partNumber} → ETag. " +
            "POST /uploads/{uploadId}/complete { parts: [{partNumber, etag}] } → 202 { videoId, status: 'processing' }. " +
            "GET /videos/{id} → { id, title, streamUrl, thumbnailUrl, duration, resolutions, status }. " +
            "GET /videos/{id}/stream/{quality}/index.m3u8 → HLS manifest. " +
            "POST /videos/{id}/views → 204 (async view count).",
        },
        {
          step: "Chunked Upload (TUS Protocol)",
          detail:
            "Client splits file into 10 MB chunks. Each chunk uploaded with Content-Range header. " +
            "Upload Service writes chunks to S3 multipart upload. " +
            "On network failure: client resumes from last acknowledged chunk (HEAD request returns uploaded byte offset). " +
            "On multipart complete: Upload Service publishes video.uploaded event to Kafka → triggers transcoding.",
        },
        {
          step: "Transcoding Pipeline",
          detail:
            "Kafka consumer assigns transcoding job to a worker from the pool. " +
            "Worker downloads raw video from S3. " +
            "FFmpeg segments video into 10-second chunks per target resolution (360p, 720p, 1080p, 4K). " +
            "Parallel processing: one worker per resolution (4 workers per video). " +
            "Output: HLS segments (.ts files) + manifest (index.m3u8) uploaded to S3/CDN origin. " +
            "On completion: update video metadata status = 'ready', generate thumbnail from frame at 10s mark.",
        },
        {
          step: "Adaptive Bitrate Streaming (HLS/DASH)",
          detail:
            "Master manifest lists all available quality levels and their bandwidths. " +
            "Video player (hls.js) measures real download speed every 2 segments and selects the highest " +
            "quality whose bitrate ≤ 0.8 × measured bandwidth. " +
            "Segments are 10 seconds each — quality switch takes effect within 10 s. " +
            "CDN caches each segment (.ts) independently — cache-hit ratio > 95% for popular videos.",
        },
        {
          step: "CDN Strategy",
          detail:
            "Multi-CDN (CloudFront + Fastly for redundancy). CDN PoPs in 200+ cities. " +
            "Cache-Control: max-age=31536000 for video segments (immutable once created). " +
            "Thumbnails: max-age=86400. " +
            "HLS manifests: max-age=5 (change as new qualities become available during transcoding). " +
            "Origin shield: single AWS region as CDN origin to prevent thundering-herd on origin on cache misses.",
        },
        {
          step: "View Count & Metadata",
          detail:
            "View event: client POSTs /views after 30 seconds of watch time. " +
            "API server increments Redis counter view:{videoId} (INCR). " +
            "Background job flushes Redis counters to PostgreSQL every 30 s. " +
            "Fraud filter: rate-limit per userId (max 1 view credit per video per 24 h). " +
            "Metadata (title, description, tags, channel) in PostgreSQL; search indexed in Elasticsearch.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Monolithic Transcoder vs Distributed Workers",
          tradeoff:
            "Single-machine transcoder: simple but too slow (hours for long videos). " +
            "Distributed pipeline (one worker per resolution, parallel): 4–5x faster but requires orchestration. " +
            "Further parallelism: split video into 1-min segments, transcode in parallel, then concatenate (used by YouTube).",
        },
        {
          aspect: "HLS vs DASH",
          tradeoff:
            "HLS: Apple-native, widely supported, requires fmp4 or ts container. " +
            "DASH: codec-agnostic, better for DRM, supported everywhere except older Safari. " +
            "YouTube uses DASH; most platforms serve both for maximum compatibility.",
        },
        {
          aspect: "CDN vs Self-Hosted Streaming",
          tradeoff:
            "CDN: cheap egress at scale, global PoPs, managed. Cannot customise deeply. " +
            "Self-hosted: full control, better for DRM enforcement, but massive infrastructure cost. " +
            "CDN for public content + signed URLs for paid/DRM content is the industry standard.",
        },
        {
          aspect: "View Count Accuracy",
          tradeoff:
            "Synchronous DB write per view: accurate but fails at 1B views/day scale. " +
            "Redis INCR with periodic flush: ~99.9% accurate (lose counts only if Redis crashes between flushes). " +
            "Acceptable — YouTube displays rounded counts (1.2M, not 1,247,832) anyway.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Video streaming: strongly favour AP — a user must never be blocked from watching due to a metadata outage. " +
            "Upload and transcoding status: favour CP — users need accurate upload confirmation. " +
            "View counts: AP — eventual consistency with rounded display is fine.",
        },
      ],
      diagram: {
        components: [
          "Client (browser/app, hls.js player)",
          "CDN (CloudFront/Fastly, 200+ PoPs)",
          "Upload Service",
          "S3 (raw uploads, HLS segments, thumbnails)",
          "Kafka (video.uploaded events)",
          "Transcoding Workers (FFmpeg, autoscaled)",
          "Metadata Service",
          "PostgreSQL (video metadata, channels, users)",
          "Redis (view count INCR, recommendation cache)",
          "Elasticsearch (search index)",
          "Recommendation Service (ML, offline trained)",
        ],
        flow:
          "Upload: Client → Upload Service (TUS chunks) → S3 raw → Kafka video.uploaded " +
          "→ Transcoding Workers → HLS segments to S3/CDN origin → metadata status = ready. " +
          "Stream: Client → CDN (cache hit → .ts segment direct). " +
          "CDN miss → S3 origin → CDN cache populate → client. " +
          "View: Client → Redis INCR → async flush to PostgreSQL.",
      },
    },
  },

  {
    title: "Design Google Drive / Dropbox",
    difficulty: "HARD",
    description:
      "Design a cloud file storage and synchronisation service like Google Drive or Dropbox. " +
      "Users can upload files from any device, and those files automatically sync to all their " +
      "other devices. The system must support file sharing, version history, " +
      "and handle large files efficiently using delta sync (only sync changed portions of a file).",
    requirements: [
      "Upload, download, and delete files and folders from any device",
      "Automatic background sync — changes on one device appear on all others within 30 seconds",
      "File sharing with specific users (view/edit) or via a public link",
      "Version history: minimum 30 previous versions per file",
      "Delta sync: only transfer changed file blocks on update",
      "Support files up to 5 TB",
      "Conflict detection and resolution for simultaneous offline edits",
    ],
    constraints: [
      "500 million users; 50 million daily active users",
      "Average user storage: 10 GB → 5 petabytes total",
      "File uploads: 10 million files/day (average 1 MB = 10 TB/day ingested)",
      "Sync latency: changes visible on other devices within 30 seconds",
      "Deduplication: globally identical files stored only once (content-addressed storage)",
      "99.999% file durability (equivalent to AWS S3 11-nines model)",
      "Metadata operations (list folder, rename) < 100 ms",
    ],
    hints: [
      "A 5 TB file cannot be uploaded in a single HTTP request reliably — what chunking strategy works for large files?",
      "If two users upload the exact same file independently, why store it twice? What hashing scheme allows you to detect and deduplicate content at the block level?",
      "When syncing a 1 GB file where only 1 KB changed, you don't want to re-upload 1 GB — how does block-level delta sync work?",
      "With 500 million users and multiple devices each, how do you efficiently notify all of a user's devices when a file changes?",
      "Version history requires storing old versions, but storing full copies of every version is expensive for large files — how does Git solve a similar problem, and can you apply the same idea?",
      "If Alice edits a file on her laptop while offline, and Bob edits the same shared file on his phone while offline, what should happen when both come online? Who wins?",
    ],
    solution: {
      overview:
        "Split the system into a Metadata Service (PostgreSQL — files, folders, permissions, versions) " +
        "and a Block Storage Service (S3 — content-addressed, globally deduplicated file chunks). " +
        "Files are split into 4 MB blocks; each block is hashed (SHA-256) and stored once. " +
        "A file is represented as an ordered list of block hashes. " +
        "On upload, only blocks with new hashes are transferred. " +
        "Sync notifications use a long-poll or WebSocket channel from the Sync Service. " +
        "Conflicts generate a 'conflicted copy' file, similar to Dropbox.",
      steps: [
        {
          step: "API Design",
          detail:
            "POST /files/upload/initiate { filename, size, parentFolderId } → { fileId, blockUploadUrls[] }. " +
            "PUT /blocks/{blockHash} (upload a single 4 MB block, idempotent). " +
            "POST /files/upload/commit { fileId, blockList: [hash1, hash2, ...] } → 201 { fileId, version }. " +
            "GET /files/{id}/download → presigned S3 URL or byte-range stream. " +
            "GET /files/{id}/versions → [{ version, modifiedAt, size, modifiedBy }]. " +
            "GET /sync/events?deviceId={id}&cursor={version} → SSE stream of change events.",
        },
        {
          step: "Block Storage & Deduplication",
          detail:
            "Client-side: split file into 4 MB fixed-size blocks (or variable-size using Rabin fingerprinting for better dedup). " +
            "Compute SHA-256 of each block. " +
            "Ask server: POST /blocks/check { hashes: [...] } → { missing: [hash1, hash3] }. " +
            "Upload only missing blocks to S3 at key blocks/{sha256[0:2]}/{sha256} (content-addressed). " +
            "S3 object is immutable once stored — never overwritten (append-only). " +
            "Global dedup: two users uploading the same file → 0 additional bytes stored after first upload.",
        },
        {
          step: "Metadata Schema (PostgreSQL)",
          detail:
            "Table files: id UUID PK, owner_id UUID, parent_folder_id UUID, name VARCHAR, " +
            "size BIGINT, content_type VARCHAR, current_version_id UUID, created_at, updated_at. " +
            "Table file_versions: id UUID PK, file_id UUID FK, version_number INT, " +
            "block_list TEXT[] (ordered SHA-256 hashes), created_by UUID, created_at. " +
            "Table shares: id UUID PK, file_id UUID, grantee_id UUID, permission ENUM(view,edit), expires_at. " +
            "Index: (owner_id, parent_folder_id) for folder listings.",
        },
        {
          step: "Sync Notification",
          detail:
            "On file commit: Sync Service publishes change event { userId, fileId, version } to Kafka topic file-changes. " +
            "A Notification Fanout worker fans out to all device sessions for that user (from Redis session registry). " +
            "Device client receives SSE push → checks which block hashes it already has locally → downloads only new blocks. " +
            "Offline devices: catch up via GET /sync/events?cursor={lastKnownVersion} on reconnect (event log in PostgreSQL).",
        },
        {
          step: "Delta Sync",
          detail:
            "Local client maintains a block hash manifest for each tracked file. " +
            "On file change (detected via OS file-watcher): recompute block hashes. " +
            "Diff against stored manifest → identify changed/added blocks. " +
            "Upload only changed blocks (often < 1% of file for document edits). " +
            "Commit new version with updated ordered block list. " +
            "Download side: new version's block list diffed against local manifest → download only missing blocks.",
        },
        {
          step: "Conflict Resolution",
          detail:
            "Optimistic concurrency: commit includes { expectedVersion: N }. " +
            "If server version > N when commit arrives: conflict detected. " +
            "Server creates a 'conflicted copy': renames the incoming file to 'Document (Alice's conflicted copy 2026-04-08)'. " +
            "Both versions preserved. User manually resolves. " +
            "For text files: optional 3-way merge (like Git) attempted first; if clean merge succeeds, no conflict copy.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Fixed vs Variable Block Size",
          tradeoff:
            "Fixed 4 MB blocks: simple to implement, poor dedup for file insertions (all subsequent blocks change hash). " +
            "Variable blocks (Rabin fingerprinting / CDC): better dedup ratio (~60% better for text edits), " +
            "more complex. Dropbox uses Rabin CDC; Google Drive uses fixed blocks.",
        },
        {
          aspect: "Client-Side vs Server-Side Chunking",
          tradeoff:
            "Client-side: delta computation happens locally (no data sent to server for unchanged blocks). " +
            "Server-side: simpler client, but server must receive full file to compute diff. " +
            "Client-side is mandatory for efficient delta sync.",
        },
        {
          aspect: "Metadata DB Choice",
          tradeoff:
            "PostgreSQL: strong consistency for file/version metadata (you never want a missing or duplicated version). " +
            "NoSQL (DynamoDB): higher write throughput but weaker consistency — risky for versioned file metadata. " +
            "PostgreSQL is the right choice; scale via read replicas and connection pooling (PgBouncer).",
        },
        {
          aspect: "Conflict Strategy",
          tradeoff:
            "Last-write-wins: simple but silently loses data. " +
            "Conflicted copy: preserves both versions but requires user intervention. " +
            "3-way merge: automatic for text but fails for binary files. " +
            "Industry standard (Dropbox, Drive): conflicted copy for general files + 3-way merge for Google Docs.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Strongly favour CP for metadata (file versions, permissions) — losing a file version is unacceptable. " +
            "Favour AP for sync notifications — a 30-second delay in sync is tolerable, a corrupted file is not.",
        },
      ],
      diagram: {
        components: [
          "Desktop/Mobile Client (file watcher, block splitter)",
          "Load Balancer",
          "Upload Service",
          "Block Check Service",
          "S3 (content-addressed block store)",
          "Metadata Service",
          "PostgreSQL (files, versions, shares)",
          "Sync Service (SSE/WebSocket push)",
          "Kafka (file-changes topic)",
          "Notification Fanout Worker",
          "Redis (device session registry)",
          "CDN (public link downloads)",
        ],
        flow:
          "Upload: Client splits file → block hashes → POST /blocks/check → upload missing blocks to S3 " +
          "→ POST /commit → PostgreSQL version record → Kafka file-changes. " +
          "Sync: Kafka → Fanout Worker → Redis (device sessions) → SSE push to all devices. " +
          "Device receives push → downloads only missing blocks from S3/CDN → reconstructs file locally.",
      },
    },
  },

  {
    title: "Design a Distributed Message Queue (Kafka)",
    difficulty: "HARD",
    description:
      "Design a distributed, durable, high-throughput message queue system similar to " +
      "Apache Kafka. The system must allow producers to publish events to named topics, " +
      "support multiple independent consumer groups each reading the full message stream, " +
      "guarantee at-least-once delivery, and retain messages for configurable periods even " +
      "after consumption.",
    requirements: [
      "Producers publish messages to named topics; consumers read from topics in order",
      "Support multiple independent consumer groups — each group gets its own full copy of the message stream",
      "Partition topics for horizontal scalability; messages within a partition are strictly ordered",
      "Guarantee at-least-once delivery (messages must not be lost if broker is healthy)",
      "Message retention: configurable by time (e.g., 7 days) or size (e.g., 1 TB per topic)",
      "Support consumer offset management — consumers can replay from any offset",
      "Replication: each partition replicated across N brokers (default N=3) for fault tolerance",
    ],
    constraints: [
      "Write throughput: 1 million messages/second across all topics",
      "Message size: 1 byte – 1 MB (default 1 KB average)",
      "End-to-end latency (produce → consume): < 10 ms at p99",
      "Message retention: up to 30 days or 10 TB per topic (whichever comes first)",
      "Broker failure recovery: < 30 seconds for leader re-election",
      "Horizontal scale: add brokers with zero downtime",
      "Consumer lag monitoring: consumers must be able to query their position vs latest offset",
    ],
    hints: [
      "Kafka achieves 1M msg/s largely because of one key OS feature — what is it, and why does it eliminate multiple memory copies when sending data from disk to network?",
      "Each partition is an append-only log — why is appending to a log dramatically faster than random writes on spinning or SSD storage?",
      "Consumer groups each maintain their own offset — where is this offset stored, and what are the consistency implications of storing it in ZooKeeper vs a compacted Kafka topic itself?",
      "Replication: when does a producer consider a message 'committed'? What is the tradeoff between acks=0, acks=1, and acks=all?",
      "A partition's leader broker fails — how does the system elect a new leader and ensure no committed messages are lost?",
      "Log compaction is an alternative to time/size-based retention — what problem does it solve and what use case is it designed for?",
    ],
    solution: {
      overview:
        "Topics are divided into partitions — each partition is an append-only commit log stored on disk. " +
        "Each partition is replicated across R brokers (ISR — In-Sync Replica set). " +
        "Producers write to the partition leader (chosen by key hash or round-robin). " +
        "Leader appends to its log and replicates to followers. " +
        "Consumers pull messages by specifying partition + offset. " +
        "ZooKeeper (or KRaft) manages broker membership and leader election. " +
        "Sequential disk I/O + OS page cache + zero-copy (sendfile) achieves ~1 GB/s throughput per broker.",
      steps: [
        {
          step: "Core Abstractions",
          detail:
            "Topic: logical channel. Partition: ordered, immutable append log (a segment file on disk). " +
            "Offset: sequential integer identifying each message within a partition. " +
            "Consumer Group: a group of consumers sharing partition assignments (each partition consumed by exactly one member). " +
            "ISR (In-Sync Replicas): set of replicas fully caught up with the leader — defines commit safety.",
        },
        {
          step: "Broker Storage Design",
          detail:
            "Each partition = series of segment files (default 1 GB each) + index files. " +
            "Active segment: messages appended sequentially. Older segments: read-only. " +
            "Index file maps offset → byte position within segment for O(log N) offset seek. " +
            "No random writes — sequential I/O maximises disk throughput (~500 MB/s vs 50 MB/s random). " +
            "OS page cache absorbs hot reads — active consumers often read directly from cache without disk I/O.",
        },
        {
          step: "Producer Write Path",
          detail:
            "Producer selects partition by key hash (same key → same partition → ordered). " +
            "Sends batch of messages to leader broker. " +
            "acks=all: leader waits for all ISR replicas to write before ACKing producer → durable but +2 ms latency. " +
            "acks=1: leader ACKs after own write → lower latency but message lost if leader crashes before replication. " +
            "acks=0: fire-and-forget → maximum throughput, no durability guarantee. " +
            "Producer batches messages (linger.ms=5, batch.size=16KB) to amortise network overhead.",
        },
        {
          step: "Consumer Pull Model",
          detail:
            "Consumers poll broker with { topic, partition, offset, maxBytes }. " +
            "Broker returns messages from offset using zero-copy sendfile() → kernel transfers data from page cache directly to NIC buffer, " +
            "bypassing userspace → 4x higher throughput vs standard read+send. " +
            "Consumer commits offset after processing (commitSync or commitAsync). " +
            "Offsets stored in __consumer_offsets topic (compacted log), replicated across 50 partitions.",
        },
        {
          step: "Replication & Fault Tolerance",
          detail:
            "Replication factor R=3: one leader + 2 followers per partition. " +
            "Followers fetch from leader continuously (same pull API as consumers). " +
            "Message 'committed' only when all ISR replicas have appended it. " +
            "Leader failure: ZooKeeper/KRaft triggers leader election among ISR members. " +
            "New leader is an ISR member → guaranteed to have all committed messages → no data loss. " +
            "Unclean leader election disabled by default (prevents data loss but may delay availability).",
        },
        {
          step: "Log Compaction & Retention",
          detail:
            "Time-based retention: delete segments older than retention.ms (e.g., 7 days). " +
            "Size-based retention: delete oldest segments when topic exceeds retention.bytes. " +
            "Log compaction (compacted topics): retain only the latest message per key. " +
            "Use case: changelog topics (DB CDC) — consumers can always reconstruct current state by reading compacted log from offset 0. " +
            "Consumer Lag Monitoring: metrics service polls list_offsets(latest) and consumer committed offset → lag = latest - committed.",
        },
      ],
      tradeoffs: [
        {
          aspect: "Push vs Pull Consumer Model",
          tradeoff:
            "Push (broker sends to consumer): broker must track consumer capacity, risks overwhelming slow consumers. " +
            "Pull (consumer fetches at own rate): consumer controls pace, allows batching, natural back-pressure. " +
            "Kafka uses pull — consumers fetch when ready. Slight downside: polling adds latency for sparse topics " +
            "(mitigated by long-poll with fetch.min.bytes and fetch.max.wait.ms).",
        },
        {
          aspect: "acks=1 vs acks=all",
          tradeoff:
            "acks=1: ~1 ms lower latency. Message lost if leader crashes before replication. " +
            "acks=all: +2 ms latency (waits for ISR sync). No committed message is ever lost. " +
            "Financial transactions, audit logs: acks=all. Metrics, logs: acks=1 acceptable.",
        },
        {
          aspect: "Partition Count",
          tradeoff:
            "More partitions: higher parallelism (more consumers in a group), higher throughput. " +
            "Too many partitions: higher ZooKeeper load, longer leader election time, more file handles. " +
            "Rule of thumb: partitions = max(target_throughput / per_partition_throughput, consumer_count).",
        },
        {
          aspect: "ZooKeeper vs KRaft",
          tradeoff:
            "ZooKeeper (Kafka < 2.8): external dependency, separate ops burden, slower metadata operations. " +
            "KRaft (Kafka ≥ 3.3): self-managed Raft consensus inside Kafka, no ZooKeeper needed, faster failover. " +
            "New deployments should use KRaft.",
        },
        {
          aspect: "CAP Theorem",
          tradeoff:
            "Kafka favours CP by default (acks=all, unclean leader election disabled). " +
            "During a network partition, the minority side stops accepting writes rather than risk data loss. " +
            "Configurable towards AP by enabling unclean leader election — trades durability for availability.",
        },
      ],
      diagram: {
        components: [
          "Producer (batch + key hash partitioner)",
          "Broker 1 (Partition 0 Leader, Partition 1 Follower)",
          "Broker 2 (Partition 1 Leader, Partition 0 Follower)",
          "Broker 3 (Partition 0 Follower, Partition 1 Follower)",
          "ZooKeeper / KRaft Controller",
          "Consumer Group A (analytics) — pulls partition 0 + 1",
          "Consumer Group B (alerts) — pulls partition 0 + 1",
          "__consumer_offsets topic (internal, compacted)",
          "Segment Files on disk per broker",
        ],
        flow:
          "Produce: Producer → key hash → Partition 0 leader (Broker 1) → append to segment log " +
          "→ replicate to Broker 2 + 3 (followers pull) → ACK to producer when all ISR acked. " +
          "Consume: Consumer A polls Broker 1 (Partition 0 leader) with {offset: 42} " +
          "→ sendfile() → messages returned → Consumer commits offset 58 to __consumer_offsets. " +
          "Broker 1 fails: ZooKeeper detects → elects Broker 2 (ISR member) as Partition 0 leader → consumers reconnect.",
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Seed execution
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting database seed...\n");

  // ── 1. Upsert admin user ──────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@judge0.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@judge0.dev",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: ${admin.email}  (password: Admin@1234)`);

  // ── 2. Upsert demo user ───────────────────────────────────────────────────
  const userPassword = await bcrypt.hash("Student@1234", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "student@judge0.dev" },
    update: {},
    create: {
      name: "Demo Student",
      email: "student@judge0.dev",
      password: userPassword,
      role: "USER",
      subscription: { create: { plan: "FREE" } },
    },
  });
  console.log(`✅ Demo user:  ${demoUser.email}  (password: Student@1234)\n`);

  // ── 3. Seed problems ──────────────────────────────────────────────────────
  let created = 0;
  let skipped = 0;

  for (const prob of problems) {
    const existing = await prisma.problem.findFirst({ where: { title: prob.title } });
    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${prob.title}`);
      skipped++;
      continue;
    }

    const { testCases, ...problemData } = prob;
    await prisma.problem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases,
        },
      },
    });

    const tcCount = testCases.length;
    const hiddenCount = testCases.filter((t) => t.isHidden).length;
    console.log(
      `  ✅ [${prob.difficulty.padEnd(6)}] ${prob.title.padEnd(50)} ${tcCount} test cases (${hiddenCount} hidden)`
    );
    created++;
  }

  console.log(`\n📐 Seeding system design questions...`);
  let sdCreated = 0;
  let sdSkipped = 0;

  for (const q of systemDesignQuestions) {
    const existing = await prisma.systemDesignQuestion.findFirst({
      where: { title: q.title },
    });
    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${q.title}`);
      sdSkipped++;
      continue;
    }

    await prisma.systemDesignQuestion.create({ data: q });
    console.log(`  ✅ [${q.difficulty.padEnd(6)}] ${q.title}`);
    sdCreated++;
  }

  const assessmentSeed = await seedAssessments();

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Problems created         : ${created}`);
  console.log(`   Problems skipped         : ${skipped}`);
  console.log(`   Total problems           : ${created + skipped}`);
  console.log(`   SD questions created     : ${sdCreated}`);
  console.log(`   SD questions skipped     : ${sdSkipped}`);
  console.log(`   Total SD questions       : ${sdCreated + sdSkipped}`);
  console.log(`   Assessment categories    : ${assessmentSeed.categoryCount}`);
  console.log(`   Assessment topics        : ${assessmentSeed.topicCount}`);
  console.log(`   Assessment questions     : ${assessmentSeed.questionCount}`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
