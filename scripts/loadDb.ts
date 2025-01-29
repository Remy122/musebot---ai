import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

// Validate environment variables
const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OPENAI_API_KEY,
} = process.env;

if (
  !ASTRA_DB_NAMESPACE ||
  !ASTRA_DB_COLLECTION ||
  !ASTRA_DB_API_ENDPOINT ||
  !ASTRA_DB_APPLICATION_TOKEN ||
  !OPENAI_API_KEY
) {
  throw new Error("Missing required environment variables.");
}

// Initialize OpenAI and Astra DB clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

// Sample URLs to scrape
const prodData = [
  "https://www.landr.com/how-to-mix/",
  "https://www.avid.com/resource-center/how-to-mix-music",
  "https://en.wikipedia.org/wiki/Music_theory",
];

// Text splitter configuration
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 100,
});

/**
 * Create a collection in Astra DB with a vector configuration.
 * @param similarityMetric - The similarity metric to use for vector search.
 */
const createCollection = async (
  similarityMetric: SimilarityMetric = "dot_product"
) => {
  try {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
      vector: {
        dimension: 1536,
        metric: similarityMetric,
      },
    });
    console.log("Collection created:", res);
  } catch (err) {
    console.error("Error creating collection:", err);
    throw err;
  }
};

/**
 * Scrape a web page and return its text content.
 * @param url - The URL of the page to scrape.
 * @returns The cleaned text content of the page.
 */
const scrapePage = async (url: string): Promise<string> => {
  try {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        headless: true,
      },
      gotoOptions: {
        waitUntil: "domcontentloaded",
      },
      evaluate: async (page, browser) => {
        const result = await page.evaluate(() => document.body.innerHTML);
        await browser.close();
        return result;
      },
    });
    const content = await loader.scrape();
    return content?.replace(/<[^>]*>?/gm, ""); // Remove HTML tags
  } catch (err) {
    console.error(`Error scraping ${url}:`, err);
    throw err;
  }
};

/**
 * Load sample data into Astra DB.
 */
const loadSampleData = async () => {
  const collection = await db.collection(ASTRA_DB_COLLECTION);
  for (const url of prodData) {
    try {
      console.log(`Scraping and processing ${url}...`);
      const content = await scrapePage(url);
      const chunks = await splitter.splitText(content);

      for (const chunk of chunks) {
        const embedding = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
          encoding_format: "float",
        });
        const vector = embedding.data[0].embedding;

        const res = await collection.insertOne({
          $vector: vector,
          text: chunk,
        });
        console.log("Inserted document:", res);
      }
    } catch (err) {
      console.error(`Error processing ${url}:`, err);
    }
  }
};

// Main execution
(async () => {
  try {
    await createCollection();
    await loadSampleData();
    console.log("Data loading complete.");
  } catch (err) {
    console.error("Error in main execution:", err);
  }
})();
