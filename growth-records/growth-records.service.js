const { getDatabaseConnection } = require("../_helpers/db");
const mongo = require("mongodb");
const xlsx = require("json-as-xlsx");
const fs = require("fs");
const path = require("path");
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
  updatePercentiles,
};

const readCSV = async (filePath) => {
  const csvFile = fs.readFileSync(filePath);
  const csvData = csvFile.toString();
  return new Promise((resolve) => {
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
    });
  });
};

const COLORS = {
  "2nd (2.3rd)": "red",
  "5th": "yellow",
  "10th": "yellow",
  "25th": "green",
  "50th": "green",
  "75th": "green",
  "90th": "yellow",
  "95th": "yellow",
  "98th (97.7th)": "red",
};

async function calculatePercentile(length, weight, gender) {
  const filePath = path.resolve(
    __dirname,
    gender === "Female"
      ? "girls_weight_for_length_percentiles.csv"
      : "boys_weight_for_length_percentiles.csv"
  );
  const csvData = await readCSV(filePath);
  const roundedLength = Math.round(length * 2) / 2;

  const row = csvData.find((d) => parseFloat(d.Length) === roundedLength);

  if (!row) {
    throw new Error("Length not found in data");
  }

  const percentiles = [
    "2nd (2.3rd)",
    "5th",
    "10th",
    "25th",
    "50th",
    "75th",
    "90th",
    "95th",
    "98th (97.7th)",
  ];

  for (let i = 0; i < percentiles.length; i++) {
    const currentPercentileLeft = percentiles[i];
    const currentPercentileRight = percentiles[percentiles.length - i - 1];
    if (weight < row[currentPercentileLeft]) return currentPercentileLeft;
    if (weight > row[currentPercentileRight]) return currentPercentileRight;
  }
}

async function updatePercentiles() {
  const db = await getDatabaseConnection();
  const records = await db.collection("growth-records").find({}).toArray();

  for (let i = 0; i < records.length; i++) {
    const percentile = await calculatePercentile(
      records[i].height,
      records[i].weight,
      records[i].gender
    );
    const percentileData = {
      percentile,
      color: COLORS[percentile],
    };
    await db
      .collection("growth-records")
      .updateOne(
        { _id: new mongo.ObjectID(records[i]._id) },
        { $set: { percentile: percentileData } }
      );
  }
}

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

  const percentile = await calculatePercentile(record.height, record.weight, record.gender);
  record["percentile"] = {
    percentile,
    color: COLORS[percentile],
  };

  const [clinic] = await db
    .collection("clinics")
    .find({ clinicId: parent.assignedclinic })
    .toArray();
  record["clinicId"] = clinic._id;
  record["clinicName"] = clinic.clinicname;

  await db.collection("growth-records").insertOne(record);
  return record;
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
  const percentile = await calculatePercentile(record.height, record.weight, record.gender);
  record["percentile"] = {
    percentile,
    color: COLORS[percentile],
  };

  await db.collection("growth-records").insertOne(record);
  return record;
}

function exportRecords(records) {
  const mappedRecords = records.map((record) => ({
    Date: record.timestamp.slice(0, 10),
    Username: String(
      record.userType === "participant"
        ? record.participantUsername
        : record.parentUsername
    ),
    "Age (months)": record.age,
    Gender: record.gender,
    "Weight (kg)": record.weight,
    "Length (cm)": record.height,
    Percentile: record.percentile.percentile,
  }));

  const data = [
    {
      sheet: "Sheet 1",
      columns: [
        { label: "Date", value: "Date" },
        { label: "Username", value: "Username" },
        { label: "Age (months)", value: "Age (months)" },
        { label: "Gender", value: "Gender" },
        { label: "Weight (kg)", value: "Weight (kg)" },
        { label: "Length (cm)", value: "Length (cm)" },
        { label: "Percentile", value: "Percentile" },
      ],
      content: mappedRecords,
    },
  ];
  const settings = {
    writeOptions: {
      type: "buffer",
      bookType: "xlsx",
    },
  };

  return xlsx(data, settings);
}
async function exportAllRecords(userId) {
  const records = await getAllParentRecords(userId);
  return exportRecords(records);
}
async function exportClinicRecords(userId) {
  const records = await getAllClinicRecords(userId);
  return exportRecords(records);
}
async function getParentRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  return await db
    .collection("growth-records")
    .find({ parentId: o_userId })
    .sort({ timestamp: -1 })
    .toArray();
}
async function getParticipantRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  return await db
    .collection("growth-records")
    .find({ participantId: o_userId })
    .sort({ timestamp: -1 })
    .toArray();
}

function trimTimestamps(records) {
  return records.map((x) => ({ ...x, timestamp: x.timestamp.slice(0, 10) }));
}

async function getAllParentRecords(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [admin] = await db
    .collection("admins")
    .find({ _id: o_userId })
    .toArray();

  if (!admin?._id) throw new Error("Forbidden");
  return trimTimestamps(
    await db
      .collection("growth-records")
      .find()
      .sort({ timestamp: -1 })
      .toArray()
  );
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
  return trimTimestamps(
    await db
      .collection("growth-records")
      .find({ clinicId: o_clinicId })
      .sort({ timestamp: -1 })
      .toArray()
  );
}
