import { Client } from "pg";

const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "llmgateway",
    password: "12345",
    port: 5555
});

try {
    await client.connect();

    const res = await client.query(
        "SELECT $1::text AS message",
        ["Hello world!"]
    );

    console.log(res.rows[0].message);
} catch (err) {
    console.error("Database connection/query failed:", err);
} finally {
    await client.end();
}