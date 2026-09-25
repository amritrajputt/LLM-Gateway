import OpenAI from "openai";
import { ApiError } from "../../common/errors/ApiError";
import { ApiResponse } from "../../common/responses/ApiResponse";

async function llmRouter(Query: string) {
    const client = new OpenAI();
    if (!Query) {
        throw ApiError.badRequest("Query parameter is required");
    }
    const response = await client.responses.create({
        model: "gpt-5.4-mini",
        input: "you are a llm gateway, you will receive a query and return the result of the query, the query is: " + Query,
    });

    console.log(response.output_text);
}