const { getDatabaseConnection } = require("../_helpers/db");
const mongo = require("mongodb");

module.exports = {
  getParentRecords,
  createRecord,
};

async function createRecord(userId, data) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const record = { ...data };

  const [parent] = await db
    .collection("parents")
    .find({ _id: o_userId })
    .toArray();
  record["parentUsername"] = parent.username;
  record["parentId"] = o_userId

  const [clinic] = await db
    .collection("clinics")
    .find({ clinicId: parent.assignedclinic })
    .toArray();
  record["clinicId"] = clinic._id;
  record["clinicName"] = clinic.clinicname;

  return await db.collection("growth-records").insertOne(record);
}

async function getParentRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  return await db.collection("growth-records").find({ parentId: o_userId }).toArray();
}
