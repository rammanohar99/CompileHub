const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const JUDGE0_URL = "http://localhost:2358";

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Run code
app.post("/run", async (req, res) => {
  try {
    const { source_code, language_id } = req.body;

    const response = await axios.post(`${JUDGE0_URL}/submissions?wait=true`, {
      source_code,
      language_id,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Execution failed" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
