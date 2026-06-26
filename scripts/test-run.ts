import { compiledWorkflow } from "../src/agents/langgraph/workflow";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
  console.log("--- Starting Graph Ingestion Test ---");
  const initialState = {
    ticker: "AAPL",
    companyName: "",
    financials: null,
    searchData: null,
    newsSentiment: null,
    decision: null,
    explainability: null,
    trace: [],
    progressMessage: "Started",
  };

  try {
    const stream = await compiledWorkflow.stream(initialState, {
      streamMode: "updates",
    });

    let finalState: any = null;
    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const update = (chunk as any)[nodeName];
      console.log(`\n>>> Node Executed: ${nodeName}`);
      console.log("Keys in update:", Object.keys(update));
      console.log("Progress Message:", update.progressMessage);
      
      finalState = { ...finalState, ...update };
    }

    console.log("\n--- Ingestion Complete ---");
    console.log("Final State keys:", finalState ? Object.keys(finalState) : "null");
    if (finalState && finalState.report) {
      console.log("✓ Report successfully generated!");
    } else {
      console.log("❌ Report is MISSING in final state.");
    }
  } catch (error) {
    console.error("❌ Graph execution failed with error:", error);
  }
}

test();
