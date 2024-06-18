const {
  createParentEvent,
  getAllEvents,
} = require("./parent-events.service");
const express = require("express");
const router = express.Router();

router.get("/admin", getEvents);
router.post("/", createEvent);

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
