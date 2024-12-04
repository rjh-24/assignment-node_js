require("dotenv").config();
// console.log(process.env);
const { MongoClient } = require("mongodb");

const reset = async () => {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db("cs-120-places");
    const places = database.collection("places");

    await places.deleteMany({});
    console.log("Purged current data in places, ready to insert new data.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  } finally {
    console.log("\nClosing connection");
    await client.close();
  }
};

reset().catch(console.dir);
