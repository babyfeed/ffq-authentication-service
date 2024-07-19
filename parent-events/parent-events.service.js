const mongo = require("mongodb");
const xlsx = require("json-as-xlsx");
const { getDatabaseConnection } = require("../_helpers/db");

module.exports = {
  getAllEvents,
  createParentEvent,
  exportEvents,
};

const getDate = (timestamp) => {
  const year = timestamp.getFullYear();
  const month = String(timestamp.getMonth() + 1).padStart(2, "0");
  const day = String(timestamp.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

async function exportEvents(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [admin] = await db
    .collection("admins")
    .find({ _id: o_userId })
    .toArray();
  if (!admin?._id) throw new Error("Forbidden");
  const events = await db
    .collection("parent-events")
    .find({ name: "external-resource-click" })
    .sort({ timestamp: 1 })
    .toArray();
  const mappedEvents = events.map((event) => ({
    Date: getDate(event.timestamp),
    Username: event.parentUsername,
    Resource: event.title,
  }));
  const data = [
    {
      sheet: "Sheet 1",
      columns: [
        { label: "Date", value: "Date" },
        { label: "Username", value: "Username" },
        { label: "Resource", value: "Resource" },
      ],
      content: mappedEvents,
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

function trimTimestamps(records) {
  return records.map((x) => ({
    ...x,
    timestamp: getDate(x.timestamp),
  }));
}

async function getAllEvents(userId) {
  const o_userId = new mongo.ObjectID(userId);
  const db = await getDatabaseConnection();
  const [admin] = await db
    .collection("admins")
    .find({ _id: o_userId })
    .toArray();
  if (!admin?._id) throw new Error("Forbidden");
  return trimTimestamps(
    await db
      .collection("parent-events")
      .find({ name: "external-resource-click" })
      .sort({ timestamp: -1 })
      .toArray()
  );
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
