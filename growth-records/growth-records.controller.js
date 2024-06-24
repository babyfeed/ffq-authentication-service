const express = require("express");
const router = express.Router();
const growthRecordsService = require("./growth-records.service");

// routes
router.post("/", postRecord);
router.post("/participant", postParticipantRecord);
router.get("/", getParentRecords);
router.get("/participant", getParticipantRecords);
router.get("/admin", getAllParentRecords);
router.get("/clinic", getAllClinicRecords);

module.exports = router;

function postRecord(req, res, next) {
  return growthRecordsService
    .createRecord(req.user.sub, req.body)
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
function postParticipantRecord(req, res, next) {
  return growthRecordsService
    .createParticipantRecord(req.user.sub, req.body)
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

function getParentRecords(req, res, next) {
  return growthRecordsService
    .getParentRecords(req.user.sub)
    .then((records) => {
      return res.status(200).json({ success: true, data: records });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
}
function getParticipantRecords(req, res, next) {
  return growthRecordsService
    .getParticipantRecords(req.user.sub)
    .then((records) => {
      return res.status(200).json({ success: true, data: records });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
}

function getAllParentRecords(req, res, next) {
  return growthRecordsService
    .getAllParentRecords(req.user.sub)
    .then((records) => {
      return res.status(200).json({ success: true, data: records });
    })
    .catch((err) => {
      console.log(err);
      if (err.message.includes("Forbidden"))
        return res.status(403).json({ success: false, message: "Forbidden" });
      next(err);
    });
}

function getAllClinicRecords(req, res, next) {
  return growthRecordsService
    .getAllClinicRecords(req.user.sub)
    .then((records) => {
      return res.status(200).json({ success: true, data: records });
    })
    .catch((err) => {
      console.log(err);
      if (err.message.includes("Forbidden"))
        return res.status(403).json({ success: false, message: "Forbidden" });
      if (err.message.includes("Clinic Not Found"))
        return res.status(404).json({ success: false, message: "Clinic not found" });
      next(err);
    });
}
