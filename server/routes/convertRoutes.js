// server/routes/convertRoutes.js

const express = require("express");
const { convertCode } = require("../controllers/convertController");

const router = express.Router();

router.post("/convert", convertCode);

module.exports = router;
