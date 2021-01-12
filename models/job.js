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
     * -minSalary
     * -hasEquity
     * -title
     * 
     */

    static async getAll(filterObj){
        if(!filterObj || !Object.keys(filterObj).length){
            const results = await db.query(`SELECT id, title, salary, equity, company_handle FROM jobs`)
            return results.rows
        }
        let keys = Object.keys(filterObj)
        let valid = ['equity', 'title', 'minSalary']
        const errs = keys.filter(k => valid.indexOf(k) === -1)
        if(errs.length){
            throw new BadRequestError(`Invalid keys: ${errs}`)
        }
        let title = filterObj.title ? filterObj.title: '';
        let minSalary = filterObj.minSalary ? filterObj.minSalary: 0
        let hasEquity = filterObj.equity == "true"? true: false

        if(hasEquity){
            console.log('***********equity')
            const results = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                            FROM jobs WHERE title ILIKE $1
                                            AND salary > $2
                                            AND equity > 0`, [`%${title}%`, minSalary])
            const jobs = results.rows;
            return jobs
        } else {
            console.log('****************no equity')
            const results = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                            FROM jobs WHERE title ILIKE $1
                                            AND salary > $2`, [`%${title}%`, minSalary])
            return results.rows
        }


    }

    /**
     * Search for a specific job by it's id
     * return {id ,title, salary, equity, company_handle}
     *   
     */

    static async getOne(id){
        const results = await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                        FROM jobs WHERE id =$1`, [id])
        if(!results.rows.length){
            throw new NotFoundError(`No job found with the id of ${id}`)
        }
        return results.rows[0]
    }

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    title, 
                                    salary, 
                                    equity,
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        return job;
      }

    static async delete(id){
        const results = await db.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [id])
        const job = results.rows[0]
        if(!job) throw new NotFoundError(`No job: ${id}`)
        return job
    }
}


module.exports = Job;