const express = require("express");
const { create_pred } = require("./bigml");
const app = express();

app.get("/", async (req, res) => {
  try {
    
    const start = req.query.from;
    const end = req.query.to;
    //const start = "2023-03-16";
    //const end = "2023-03-18";
    const results = await create_pred(start, end);
    res.send(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating prediction");
  }
});

app.listen(3004, () => {
  console.log("Server listening on port 3004");
});
