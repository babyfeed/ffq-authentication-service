const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();

async function getDatabaseConnection() {
  const url = process.env.MONGO_URI_PROD || process.env.MONGO_URI;
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client.db("ffq_database");
}

module.exports = {
  getDatabaseConnection,
};
