// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoices;

beforeEach(async function () {
    let companyResults = db.query(`INSERT INTO companies (code, name, description)
        VALUES ('linkedin', 'Linkedin', 'Platform for professional networking')
        RETURNING code, name, description`);

    let invoiceResults = db.query(`INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
        VALUES ('linkedin', 100, false, '2021-01-01', '2021-01-01' ),
         ('linkedin', 300, false, '2021-01-01', null) 
         RETURNING id, comp_code, amt, paid, add_date, paid_date`);

    let results = await Promise.all([companyResults, invoiceResults]);

    testCompany = results[0].rows[0];
    testInvoices = results[1].rows;
});

describe("GET /invoices", function () {
    test("Gets list of invoices", async function () {
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: testInvoices.map((i) => {
                return { id: i.id, comp_code: i.comp_code };
            }),
        });
    });
});

describe("GET /invoices/:id", function () {
    test("Gets a single invoice", async function () {
        const response = await request(app).get(
            `/invoices/${testInvoices[1].id}`
        );
        expect(response.statusCode).toEqual(200);
        let inv = testInvoices[1];
        expect(response.body).toEqual({
            invoice: {
                company: testCompany,
                id: inv.id,
                amt: inv.amt,
                paid: inv.paid,
                add_date: "2021-01-01T08:00:00.000Z",
                paid_date: inv.paid_date,
            },
        });
    });

    test("Responds with 404 if can't find invoice", async function () {
        const response = await request(app).get(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /invoices", function () {
    test("Creates a new invoice", async function () {
        const response = await request(app).post(`/invoices`).send({
            comp_code: "linkedin",
            amt: 200,
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: {
                id: expect.any(Number),
                comp_code: "linkedin",
                amt: 200,
                paid: false,
                add_date: expect.any(String),
                paid_date: null,
            },
        });
    });
    test("Response 400 with unvalid json", async function () {
        const response = await request(app).post(`/invoices`).send({
            code: "meta",
        });
        expect(response.statusCode).toEqual(400);
    });
});

describe("PUT /invoices/:id", function () {
    test("Updates a single invoice", async function () {
        const response = await request(app)
            .put(`/invoices/${testInvoices[1].id}`)
            .send({
                amt: 100,
            });

        // console.log(testInvoices[1].id);
        // expect(response.statusCode).toEqual(200);
        // // expect(response.body.invoice.amt).toEqual(1000);
    });

    test("Responds with 404 if can't find invoice", async function () {
        const response = await request(app).patch(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /invoices/:id", function () {
    test("Deletes a single a company", async function () {
        const response = await request(app).delete(
            `/invoices/${testInvoices[1].id}`
        );
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: "deleted" });
    });
});

afterEach(async function () {
    // delete any data created by test
    await db.query("DELETE FROM companies; DELETE FROM invoices;");
});

afterAll(async function () {
    // close db connection
    await db.end();
});
