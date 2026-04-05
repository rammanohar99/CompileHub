require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

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
    const record = await prisma.problem.create({
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

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Problems created : ${created}`);
  console.log(`   Problems skipped : ${skipped}`);
  console.log(`   Total problems   : ${created + skipped}`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
