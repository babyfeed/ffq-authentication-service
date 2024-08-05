const express = require("express");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const growthRecordsService = require("./growth-records.service");

// routes
router.get("/", getParentRecords);
router.post("/", postRecord);
router.get("/participant", getParticipantRecords);
router.post("/participant", postParticipantRecord);
router.get("/admin", getAllRecords);
router.get("/clinic", getAllClinicRecords);
router.get("/export/:type", exportApi);
router.get("/update-percentiles", updatePercentiles);

module.exports = router;

function updatePercentiles(req, res, next) {
  growthRecordsService.updatePercentiles().then(() => {
    return res.status(200).json({ success: true });
  });
}

function postRecord(req, res, next) {
  return growthRecordsService
    .createRecord(req.user.sub, req.body)
    .then((data) => {
      return res.status(201).json({ success: true, data });
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
      return res.status(201).json({ success: true, data });
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

const EXPORT_SERVICES = {
  admin: growthRecordsService.exportAllRecords,
  clinic: growthRecordsService.exportClinicRecords,
};
async function exportApi(req, res, next) {
  try {
    const userId = req.user.sub;
    const type = req.params.type;
    const service = EXPORT_SERVICES?.[type] ?? null;
    if (!service)
      return res.status(400).json({ success: false, message: "Invalid type" });
    const result = await service(req.user.sub);
    const filename = `growth_records_${userId}.xlsx`;
    const filepath = path.join(__dirname, filename);

    fs.writeFileSync(filepath, result);

    return res.download(filepath, (err) => {
      if (err) {
        console.error("Error downloading the file:", err);
      }
      fs.unlinkSync(filepath);
    });
  } catch (err) {
    if (err.message.includes("Forbidden"))
      return res.status(403).json({ success: false, message: "Forbidden" });
    if (err.message.includes("Not Found"))
      return res.status(404).json({ success: false, message: "Not found" });
    console.log(err);
    next(err);
  }
}

function getAllRecords(req, res, next) {
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
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      next(err);
    });
}
