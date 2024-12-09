require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const client = new MongoClient(process.env.MONGODB_URI);

let places;

client
  .connect()
  .then(() => {
    const db = client.db("cs-120-places");
    places = db.collection("places");
    console.log("MongoDB connected successfully.");

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/view", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view.html"));
});

app.post("/api/process", async (req, res) => {
  const input = req.body.input.trim();

  if (!places) {
    res.status(500).json({ error: "Database not initialized" });
    return;
  }

  try {
    let result;
    if (/^\d/.test(input)) {
      result = await places.findOne({ zips: input });
      if (result) {
        res.json({
          query: `Zip Code: ${input}`,
          city: result.city,
          zips: result.zips,
        });
      } else {
        res.json({ query: `Zip Code: ${input}`, error: "No results found." });
      }
    } else {
      result = await places.findOne({ city: input });
      if (result) {
        res.json({
          query: `City: ${input}`,
          city: result.city,
          zips: result.zips,
        });
      } else {
        res.json({ query: `City: ${input}`, error: "No results found." });
      }
    }
  } catch (error) {
    console.error("Error fetching data: ", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});
