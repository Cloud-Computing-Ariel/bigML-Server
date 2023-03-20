const bigml = require("bigml");
const fs = require("fs");
const axios = require("axios");
const { DataFrame } = require("dataframe-js");
var resource_uri = "";

async function create_pred(start_date, end_date) {
  const orders = await axios.get("http://localhost:3003", {
    params: {
      start: start_date,
      end: end_date,
    },
  });

  console.log(orders.data);
  const toppingsList = orders.data.orders.map((order) => order.toppings);

  // Create a DataFrame from the toppings list
  const df = new DataFrame(toppingsList, [
    "Onions",
    "Mushrooms",
    "Pepperoni",
    "Sausage",
    "Extra Cheese",
    "Green Pepper",
    "Tomato",
    "Bacon",
    "Corn",
    "Pineapple",
  ]);

  // Write the DataFrame as a CSV string to a file
  fs.writeFileSync("toppings_file.csv", df.toCSV());

  const connection = new bigml.BigML(
    "SHOHAM2002",
    "b3639895c3ac41f4f9c1eb765cc0d77772391ba5"
  );
  return new Promise((resolve, reject) => {
    const source = new bigml.Source(connection);
    source.create("./toppings_file.csv", function (error, sourceInfo) {
      if (error) {
        reject(error);
        return;
      }

      console.log("created source");

      const dataset = new bigml.Dataset(connection);
      dataset.create(sourceInfo, function (error, datasetInfo) {
        if (error) {
          reject(error);
          return;
        }

        console.log("created dataset");

        const association = new bigml.Association(connection);
        association.create(datasetInfo, function (error, assosInfo) {
          if (error) {
            reject(error);
            return;
          }

          resource_uri =
            assosInfo.location +
            assosInfo.resource.split("/")[1] +
            "?username=SHOHAM2002;api_key=b3639895c3ac41f4f9c1eb765cc0d77772391ba5";
          console.log(resource_uri);

          setTimeout(async function () {
            try {
              const results = await fetchData();
              resolve(results);
            } catch (error) {
              reject(error);
            }
          }, 15000);
        });
      });
    });
  });
}

async function fetchData() {
  console.log("Fetch data...");
  var results = [];
  try {
    const response = await fetch(resource_uri);
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    const data = await response.json();

    for (const rule of data.associations.rules) {
      // console.log("lhs "+rule.lhs[0]);
      // console.log("rhs "+rule.rhs[0]);
      // console.log(data.associations.items[rule.lhs[0]]);
      // console.log(data.associations.items[rule.rhs[0]]);
      var antecedent = data.associations.items[rule.lhs[0]].name;
      var consequent = data.associations.items[rule.rhs[0]].name;
      var confidence = rule.confidence;
      var support = rule.support[0];
      results.push({
        antecedent,
        consequent,
        support,
        confidence,
      });
    }
    console.log("Finish fetch data");
    console.log(results);
    return results;
  } catch (error) {
    console.error(error);
  }
}

module.exports = { create_pred };
