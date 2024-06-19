const {
  createParentEvent,
  getAllEvents,
  exportEvents: exportAllEvents,
} = require("./parent-events.service");
const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();

router.get("/admin", getEvents);
router.get("/admin/export", exportEvents);
router.post("/", createEvent);

async function exportEvents(req, res, next) {
  try {
    const userId = req.user.sub;
    const result = await exportAllEvents(req.user.sub);
    const filename = `events_${userId}.csv`;
    const filepath = path.join(__dirname, filename);

    fs.writeFileSync(filepath, result);

    return res.download(filepath, (err) => {
      if (err) {
        console.error("Error downloading the file:", err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}
function getEvents(req, res, next) {
  return getAllEvents(req.user.sub)
    .then((events) => {
      return res.status(200).json({ success: true, data: events });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
}
function createEvent(req, res, next) {
  return createParentEvent(req.user.sub, req.body)
    .then((data) => {
      return res
        .status(201)
        .json({ success: true, insertedId: data.insertedId });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
}

module.exports = router;
