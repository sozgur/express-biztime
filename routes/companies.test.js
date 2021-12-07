// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
    let results = await db.query(`INSERT INTO companies (code, name, description)
        VALUES ('linkedin', 'Linkedin', 'Platform for professional networking') 
        RETURNING code, name, description`);
    testCompany = results.rows[0];
});

describe("GET /companies", function () {
    test("Get list of companies", async function () {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [{ code: testCompany.code, name: testCompany.name }],
        });
    });
});

describe("GET /companies/:code", function () {
    test("Gets a single company", async function () {
        const response = await request(app).get(
            `/companies/${testCompany.code}`
        );
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ company: testCompany });
    });

    test("Responds with 404 if can't find company", async function () {
        const response = await request(app).get(`/companies/0`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /companies", function () {
    test("Creates a new company", async function () {
        const response = await request(app).post(`/companies`).send({
            code: "meta",
            name: "Meta",
            description: "Facebook company",
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: "meta",
                name: "Meta",
                description: "Facebook company",
            },
        });
    });
    test("Response 400 with unvalid json", async function () {
        const response = await request(app).post(`/companies`).send({
            code: "meta",
            description: "Facebook company",
        });
        expect(response.statusCode).toEqual(400);
    });
});

describe("PUT /companies/:code", function () {
    test("Updates a single company", async function () {
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: "Dev",
                description: "Developer company",
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {
                code: testCompany.code,
                name: "Dev",
                description: "Developer company",
            },
        });
    });

    test("Responds with 404 if can't find company", async function () {
        const response = await request(app).patch(`/companies/aaa`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", function () {
    test("Deletes a single a company", async function () {
        const response = await request(app).delete(
            `/companies/${testCompany.code}`
        );
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: "deleted" });
    });
});

afterEach(async function () {
    // delete any data created by test
    await db.query("DELETE FROM companies");
});

afterAll(async function () {
    // close db connection
    await db.end();
});
