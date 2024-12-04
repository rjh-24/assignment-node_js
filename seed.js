require("dotenv").config();
const { MongoClient } = require("mongodb");
const fs = require("fs");
const csv = require("csv-parser");

const seed = async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("cs-120-places");
    const places = database.collection("places");

    const filePath = "./zips.csv";

    const insertPromises = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ headers: ["city", "zip"] }))
        .on("data", async (row) => {
          const newPlace = {
            city: row["city"],
            zip: row["zip"],
          };

          const insertPromise = places
            .updateOne(
              { city: newPlace.city },
              {
                $push: { zips: newPlace.zip },
              },
              { upsert: true }
            )
            .then((result) => {
              result.upsertedCount > 0
                ? console.log(
                    `Inserted ${newPlace.city} with zip ${newPlace.zip}.`
                  )
                : console.log(`Added zip ${newPlace.zip} to ${newPlace.city}.`);
            })
            .catch((err) => {
              console.error("Error inserting document: ", err);
            });

          insertPromises.push(insertPromise);
        })
        .on("end", () => {
          console.log("CSV file successfully processed. \n");
          resolve();
        })
        .on("error", (err) => {
          console.error("Error reading file: ", err);
          reject(err);
        });
    });

    await Promise.all(insertPromises);
  } catch (error) {
    console.error("MongoDB connection error: ", error);
  } finally {
    console.log("\nClosing connection");
    await client.close();
  }
};

seed().catch(console.dir);
