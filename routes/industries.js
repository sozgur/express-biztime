const db = require("../db");
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

// get list of industries
router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(
            `SELECT i.code, i.industry, c.code AS company_code
            FROM industries AS i
            LEFT JOIN companies_industries AS ci 
            ON ci.industry_code = i.code
            LEFT JOIN companies AS c
            ON ci.company_code = c.code`
        );
        return res.json({ invoices: results.rows });
    } catch (err) {
        return next(err);
    }
});

//Add an industry to db
router.post("/", async function (req, res, next) {
    try {
        if (!req.body.code || !req.body.industry) {
            throw new ExpressError("code and industry are required", 400);
        }

        const result = await db.query(
            `INSERT INTO industries (code, industry)
            VALUES ($1, $2) RETURNING code, industry`,
            [req.body.code, req.body.industry]
        );

        return res.status(201).json({ industry: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

//associating an industry to a company
router.post("/associating", async function (req, res, next) {
    try {
        if (!req.body.company_code || !req.body.industry_code) {
            throw new ExpressError(
                "company_code and industry_code are required",
                400
            );
        }

        const result = await db.query(
            `INSERT INTO companies_industries (company_code, industry_code)
            VALUES ($1, $2)`,
            [req.body.company_code, req.body.industry_code]
        );

        return res.status(201).json({ status: "completed" });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
