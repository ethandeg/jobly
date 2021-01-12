const app = require("../app");
const express = require('express')
const router = new express.Router();
const Job = require('../models/job')
const {BadRequestError} = require("../expressError")
const jsonschema = require("jsonschema");
const jobNewSchema = require("../schemas/jobNew.json")
const jobUpdateSchema = require("../schemas/jobUpdate.json")
const {ensureAdmin} = require("../middleware/auth");
const { json } = require("body-parser");

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
 * -minSalary
 * title
 * hasEquity
 *
 * Authorization required: none
 */

 router.get('/', async (req, res, next) => {
     try {
        const filters = req.query;
        const results = await Job.getAll(filters)
        return res.json({jobs: results})
     } catch(e){
         return next(e)
     }
 })

 /**
  * Get a job by it's id
  * job: {id, title, salary, equity, company_handle}
  * authorization required: none
  */

router.get("/:id", async (req, res, next) => {
    try {
        const {id} = req.params;
        const result = await Job.getOne(id)
        return res.json({job: result})
    } catch(e){
        return next(e)
    }
})

/**
 * update a job
 * pass an id in the parameters and the data to update in the body as a PATCH request
 * data able to update => {title, salary, equity}
 * returns {job: jobData}
 */

router.patch("/:id", async (req, res, next ) => {
    try {
        const {id} = req.params;
        const validator = jsonschema.validate(jobUpdateSchema, req.body)
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const results = await Job.update(id, req.body)
        return res.json({job: results})
    } catch(e){
        return next(e)
    }
})

router.delete("/:id", async (req, res, next) => {
    try {
        await Job.delete(req.params.id)
        
        return res.json({message: "deleted"})
    } catch(e){
        return next(e)
    }
})


module.exports = router;