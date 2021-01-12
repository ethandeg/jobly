"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
    /**
     * Create a job
     * {title, salary, equity, company_handle}
     * returns id, title, salary,equity, company_hanndle
     */

    static async create({title, salary, equity, company_handle}) {
        const result = await db.query(`INSERT INTO jobs 
                                        (title, salary, equity, company_handle)
                                        VALUES ($1, $2, $3, $4)
                                        RETURNING id, title, salary, equity, company_handle AS companyHandle`, 
                                        [title, salary, equity, company_handle])
        return result.rows[0]
    }
    /**
     * Get all jobs
     * {id, title, salary, equity, company_handle}, ...]
     * available filters:
     * 
     */

    static async getAll(){
        const results = await db.query(`SELECT id, title, salary, equity, company_handle FROM jobs`)
        return results.rows
    }
}


module.exports = Job;