const app = require("../app");
const express = require('express')
const router = new express.Router();


router.get("/", async (req, res, next) =>{
    res.json('hello, world')
})


module.exports = router;