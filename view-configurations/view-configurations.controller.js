const express = require("express");
const router = express.Router();
const viewConfigurationsService = require("./view-configurations.service");

router.get("/institution/:id", getInstitutionViewConfiguration);
router.put("/institution/:id", upsertInstitutionViewConfiguration);
module.exports = router;

function upsertInstitutionViewConfiguration(req, res, next) {
  const userId = req.user.sub;
  const institutionId = req.params.id;
  return viewConfigurationsService.upsertInstitutionViewConfiguration(institutionId, userId, req.body).then((data) => {
    return res.status(200).json({ success: true, data });
  });
}

function getInstitutionViewConfiguration(req, res, next) {
  const userId = req.user.sub;
  const institutionId = req.params.id;
  return viewConfigurationsService.getInstitutionViewConfiguration(institutionId, userId).then((data) => {
    return res.status(200).json({ success: true, data });
  });
}

