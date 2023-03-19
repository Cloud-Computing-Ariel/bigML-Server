const bigml = require("bigml");
const fs = require("fs");
const axios = require("axios");

var resource_uri = "";

async function create_pred() {
  const x = await axios.get("http://localhost:3003/exportOrders", {
    params: {
      start: "03/03/2030",
      end: "03/03/2030",
    },
  });
  console.log(x.data);
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
      var antecedent = data.associations.items[rule.lhs].name;
      var consequent = data.associations.items[rule.rhs].name;
      var confidence = rule.confidence;
      var support = rule.support[0];
      results.push({
        Antecedent: antecedent,
        Consequent: consequent,
        "Support %": support,
        "Confidence %": confidence,
      });
    }
    console.log("Finish fetch data");
    return results;
  } catch (error) {
    console.error(error);
  }
}

module.exports = { create_pred };
