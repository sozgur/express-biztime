const db = require("../db");
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const slugify = require("slugify");

// get list of companies
router.get("/", async function (req, res, next) {
    try {
        const companiesQuery = await db.query(
            `SELECT code, name FROM companies`
        );
        return res.json({ companies: companiesQuery.rows });
    } catch (err) {
        return next(err);
    }
});

// gets a specific obj of companies
router.get("/:code", async function (req, res, next) {
    try {
        const companyQuery = await db.query(
            `SELECT code, name, description
            FROM companies WHERE code=$1`,
            [req.params.code]
        );

        if (companyQuery.rows.length === 0) {
            throw new ExpressError(
                `There is no company with code ${req.params.code}`,
                404
            );
        }

        const invoices = await db.query(
            `SELECT id FROM invoices WHERE comp_code=$1 ORDER BY id`,
            [req.params.code]
        );

        return res.json({
            company: companyQuery.rows[0],
            invoices: invoices.rows,
        });
    } catch (err) {
        next(err);
    }
});

//Add a company to db
router.post("/", async function (req, res, next) {
    try {
        if (!req.body.name || !req.body.description) {
            throw new ExpressError("Name and description are required", 400);
        }

        let { name, description } = req.body;
        let code = slugify(name, { lower: true });

        const companyQuery = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3) RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({ company: companyQuery.rows[0] });
    } catch (err) {
        next(err);
    }
});

// edit existing cpmpany
router.put("/:code", async function (req, res, next) {
    try {
        if (req.body.code) {
            throw new ExpressError("Code change not allowed", 400);
        } else if (!req.body.name || !req.body.description) {
            throw new ExpressError(
                "Code, name and description are required",
                400
            );
        }
        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2 
            WHERE code = $3 RETURNING code, name, description`,
            [req.body.name, req.body.description, req.params.code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(
                `There is no company with code ${req.params.code}`,
                404
            );
        }
        return res.json({ company: results.rows[0] });
    } catch (err) {
        next(err);
    }
});

// delete a company
router.delete("/:code", async function (req, res, next) {
    try {
        const results = await db.query(
            "DELETE FROM companies WHERE code=$1 RETURNING code",
            [req.params.code]
        );
        if (results.rows.length === 0) {
            throw new ExpressError(
                `There is no company with code ${req.params.code}`,
                404
            );
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
