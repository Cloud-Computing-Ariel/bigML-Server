const express = require("express");
const { create_pred } = require("./bigml");
const app = express();

app.get("/", async (req, res) => {
  // res.send("Hello World!");
  try {
    const results = await create_pred();
    res.send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating prediction");
  }
});

app.listen(3004, () => {
  console.log("Server listening on port 3000");
});
