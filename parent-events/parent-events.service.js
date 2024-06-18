const mongo = require("mongodb");
const { getDatabaseConnection } = require("../_helpers/db");

module.exports = {
  getAllEvents,
  createParentEvent,
};

async function getAllEvents(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [admin] = await db
    .collection("admins")
    .find({ _id: o_userId })
    .toArray();
  if (!admin?._id) throw new Error("Forbidden");
  return await db
    .collection("parent-events")
    .find({ name: 'external-resource-click'})
    .sort({ timestamp: 1 })
    .toArray();
}

async function createParentEvent(userId, data) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const record = { ...data };
  const [parent] = await db
    .collection("parents")
    .find({ _id: o_userId })
    .toArray();
  record["parentUsername"] = parent.username;
  record["parentId"] = o_userId;
  record["timestamp"] = new Date();

  return await db.collection("parent-events").insertOne(record);
}
