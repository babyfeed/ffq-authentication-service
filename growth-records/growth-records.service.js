const { getDatabaseConnection } = require("../_helpers/db");
const mongo = require("mongodb");
const Papa = require("papaparse");

module.exports = {
  getParentRecords,
  getParticipantRecords,
  createRecord,
  createParticipantRecord,
  getAllParentRecords,
  getAllClinicRecords,
  exportAllRecords,
  exportClinicRecords,
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
  record["parentId"] = o_userId;
  record["userType"] = "parent";

  const [clinic] = await db
    .collection("clinics")
    .find({ clinicId: parent.assignedclinic })
    .toArray();
  record["clinicId"] = clinic._id;
  record["clinicName"] = clinic.clinicname;

  return await db.collection("growth-records").insertOne(record);
}

async function createParticipantRecord(userId, data) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const record = { ...data };

  const [participant] = await db
    .collection("participants")
    .find({ _id: o_userId })
    .toArray();
  record["participantUsername"] = participant.username;
  record["participantId"] = o_userId;
  record["userType"] = "participant";

  return await db.collection("growth-records").insertOne(record);
}

async function exportAllRecords(userId) {
  const records = await getAllParentRecords(userId);
  const mappedRecords = records.map((record) => ({
    Date: record.timestamp,
    "User Type": record.userType === "participant" ? "Participant" : "Parent",
    Username:
      record.userType === "participant"
        ? record.participantUsername
        : record.parentUsername,
    Clinic: record.userType === "participant" ? "-" : record.clinicName,
    "Age (months)": record.age,
    Gender: record.gender,
    "Weight (kg)": record.weight,
    "Length (cm)": record.height,
    Percentile: record.percentile.percentile,
  }));
  return Papa.unparse(mappedRecords);
}
async function exportClinicRecords(userId) {
  const records = await getAllClinicRecords(userId);
  const mappedRecords = records.map((record) => ({
    Date: record.timestamp,
    Username: record.parentUsername,
    Clinic: record.clinicName,
    "Age (months)": record.age,
    Gender: record.gender,
    "Weight (kg)": record.weight,
    "Length (cm)": record.height,
    Percentile: record.percentile.percentile,
  }));
  return Papa.unparse(mappedRecords);
}
async function getParentRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  return await db
    .collection("growth-records")
    .find({ parentId: o_userId })
    .sort({ clinicName: 1, parentUserame: 1 })
    .toArray();
}
async function getParticipantRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  return await db
    .collection("growth-records")
    .find({ participantId: o_userId })
    .sort({ participantUsername: 1 })
    .toArray();
}

async function getAllParentRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [admin] = await db
    .collection("admins")
    .find({ _id: o_userId })
    .toArray();

  if (!admin?._id) throw new Error("Forbidden");
  return await db.collection("growth-records").find().toArray();
}

async function getAllClinicRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [clinician] = await db
    .collection("clinicians")
    .find({ _id: o_userId })
    .toArray();

  if (!clinician?._id) throw new Error("Forbidden");

  const clinicId = clinician.assignedclinic;
  const [clinic] = await db
    .collection("clinics")
    .find({ clinicId: clinicId })
    .toArray();

  if (!clinic?._id) throw new Error("Clinic Not Found");

  const o_clinicId = new mongo.ObjectID(clinic._id);
  return await db
    .collection("growth-records")
    .find({ clinicId: o_clinicId })
    .toArray();
}
