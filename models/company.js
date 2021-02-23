"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * Can filter by name, minEmployees, and max Employees
   * to filter, just pass in an object with keys for the above values
   * */

  static async findAll(filterObj) {
    //Check to see if there is any invalid data passed through to the api



    //if there is no data passed in the filter object or if there is no filter object get data on all companies
    if (!filterObj) {
      const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
         FROM companies
         ORDER BY name`);
      return companiesRes.rows;
    }
    //filter by name, minemployees and max employees
    const keys = Object.keys(filterObj)
    const validKeys = ["name", "maxEmployees", "minEmployees"]
    const errors = keys.filter(k => validKeys.indexOf(k) === -1)
    //if there are any errors, throw an error listing out the invalid keys
    if (errors.length) {
      throw new BadRequestError(`Invalid keys in request: ${errors}`)
    }
    let name = filterObj.name ? filterObj.name : ''
    let minEmployees = filterObj.minEmployees ? filterObj.minEmployees : 0;
    let maxEmployees = filterObj.maxEmployees ? filterObj.maxEmployees : 90000000
    if (filterObj.minEmployees || filterObj.maxEmployees) {
      const companiesRes = await db.query(`SELECT handle,
                                                name,
                                                description,
                                                num_employees AS "numEmployees",
                                                logo_url AS "logoUrl"
                                                FROM companies
                                                WHERE num_employees > $1
                                                AND num_employees < $2
                                                AND name ILIKE $3
                                                ORDER BY name`, [minEmployees, maxEmployees, `%${name}%`])
      return companiesRes.rows
    } else {
      //if not filtering by employees then don't include it in the response
      const companiesRes = await db.query(`SELECT handle,
                                                  name,
                                                  description,
                                                  logo_url AS "logoUrl",
                                                  num_employees AS "numEmployees"
                                                  FROM companies
                                                  WHERE name 
                                                  ILIKE $1
                                                  ORDER BY name`, [`%${name}%`])
      return companiesRes.rows
    }

  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs WHERE company_handle = $1`, [handle]
    )
    company.jobs = jobRes.rows

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
