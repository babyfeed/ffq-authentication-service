const { getDatabaseConnection } = require("../_helpers/db");
const mongo = require("mongodb");

module.exports = {
  upsertInstitutionViewConfiguration,
  getInstitutionViewConfiguration
};

async function getInstitutionViewConfiguration(institutionId, userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [admin] = await db
    .collection("admins")
    .find({ _id: o_userId })
    .toArray();
  if (!admin?._id) throw new Error("Forbidden");
  return db.collection("view-configurations").findOne({
    type: "institution",
    institutionId,
  });
}

async function upsertInstitutionViewConfiguration(institutionId, userId, body) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [admin] = await db
    .collection("admins")
    .find({ _id: o_userId })
    .toArray();
  if (!admin?._id) throw new Error("Forbidden");
  const viewConfiguration = await db.collection("view-configurations").findOne({
    type: "institution",
    institutionId,
  });

  if (viewConfiguration) {
    await db
      .collection("view-configurations")
      .updateOne(
        { institutionId },
        { $set: { ...body } }
      );
  } else {
    await db
      .collection("view-configurations")
      .insertOne({ type: "institution", institutionId, ...body });
  }
}
