const app = require("../app");
const express = require('express')
const router = new express.Router();
const Job = require('../models/job')
const {BadRequestError} = require("../expressError")
const jsonschema = require("jsonschema");
const jobNewSchema = require("../schemas/jobNew.json")
const {ensureAdmin} = require("../middleware/auth")

/**
 * Route to create a job
 * {title, salary, equity, company_handle}
 * user with admin privelages is required to create a job
 */
router.post('/', ensureAdmin, async (req, res, next) => {
    try{
        const body = req.body;
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const result = await Job.create(body)
        console.log(result)
        return res.status(201).json(result)
    } catch(e){
        return next(e)
    }
})

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * -
 *
 * Authorization required: none
 */

 router.get('/', async (req, res, next) => {
     try {
        const results = await Job.getAll()
        return res.json({jobs: results})
     } catch(e){
         return next(e)
     }
 })


module.exports = router;