import OpenAI from "openai";
import { streamText } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { openai as aiSdkOpenai } from "@ai-sdk/openai";

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages?.length - 1]?.content;

    let docContext = " ";

    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: latestMessage,
      encoding_format: "float",
    });

    try {
      const collection = await db.collection(ASTRA_DB_COLLECTION);
      const cursor = collection.find(null, {
        sort: {
          $vector: embedding.data[0].embedding,
        },
        limit: 10,
      });

      const documents = await cursor.toArray();
      const docMaps = documents?.map((doc) => doc.text);
      docContext = JSON.stringify(docMaps);
    } catch (err) {
      console.log("ERROR QUERYING DB...");
      docContext = "";
    }
    const template = {
      role: "system",
      content: ` You are a music production assistant that helps users with the creative and technical aspects of producing music. Respond to user queries by suggesting practical tips on beat-making, sound design, audio mixing, mastering, and arrangement. Use your knowledge of musical theory, production software, and industry-standard techniques to provide the user with expert guidance. If the user needs help with a particular project or sound, offer tailored recommendations for achieving their goals. If the context doesn't include the information you need answer based on your own existing knowledge and don't mention the source of your information or what the context does or doesn't include.
        Format responses using markdown where applicable and don't return images 
        ------------------
        START CONTEXT 
        ${docContext}
        END CONTEXT
        -------------
        QUESTION: ${latestMessage}
        -------------
        
        `,
    };
    const result = await streamText({
      model: aiSdkOpenai("gpt-4"),
      messages: [template, ...messages],
    });
    return result.toDataStreamResponse();
  } catch (err) {
    throw err;
  }
}
