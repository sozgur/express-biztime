const db = require("../db");
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");

// get list of invoices
router.get("/", async function (req, res, next) {
    try {
        const invoicesQuery = await db.query(
            `SELECT id, comp_code FROM invoices`
        );
        return res.json({ invoices: invoicesQuery.rows });
    } catch (err) {
        return next(err);
    }
});

// gets a specific obj of invoices
router.get("/:id", async function (req, res, next) {
    try {
        const result = await db.query(
            `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description
            FROM invoices AS i INNER JOIN companies AS c ON i.comp_code = c.code 
            WHERE id=$1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(
                `There is no invoice with id ${req.params.id}`,
                404
            );
        }

        const data = result.rows[0];

        return res.json({
            invoice: {
                id: data.id,
                amt: data.amt,
                paid: data.paid,
                add_date: data.add_date,
                paid_date: data.paid_date,
            },
            company: {
                code: data.code,
                name: data.name,
                description: data.description,
            },
        });
    } catch (err) {
        next(err);
    }
});

//Add an invoice to db
router.post("/", async function (req, res, next) {
    try {
        if (!req.body.comp_code || !req.body.amt) {
            throw new ExpressError("comp_code and amt are required", 400);
        }

        const result = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.body.comp_code, req.body.amt]
        );

        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

// edit existing invoice
router.put("/:id", async function (req, res, next) {
    try {
        const invoice = await db.query(`SELECT id FROM invoices WHERE $1`, [
            req.params.id,
        ]);

        if (invoice.rows.length === 0) {
            throw new ExpressError(
                `There is no invoice with id ${req.params.id}`,
                404
            );
        }

        const result = await db.query(
            `UPDATE invoices SET amt=$1
            WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [req.body.amt, req.params.id]
        );

        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

// delete a invoice
router.delete("/:id", async function (req, res, next) {
    try {
        const result = await db.query(
            "DELETE FROM invoices WHERE id=$1 RETURNING id",
            [req.params.id]
        );
        if (result.rows.length === 0) {
            throw new ExpressError(
                `There is no invoice with id ${req.params.id}`,
                404
            );
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
