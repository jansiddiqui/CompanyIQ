import { NextRequest } from "next/server";
import { compiledWorkflow } from "@/agents/langgraph/workflow";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/utils/rate-limit";
import { getCurrentUser } from "@/utils/auth";

// Force Node.js runtime for streaming responses
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Authentication guard — all live AI research requires a valid session
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required. Please sign in to use the AI research platform." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  
  // Rate limiter gate to prevent Gemini API quota exhaustion
  const rateLimit = checkRateLimit(ip, 10, 60000);
  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too Many Requests. Rate limit exceeded (10 requests per minute)." }), {
      status: 429,
      headers: { 
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
      },
    });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(JSON.stringify({ error: "Missing query parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let traceEntry: any = null;
      const sendSSE = (event: string, data: any) => {
        const payload = { ...data };
        if (event === "progress" && traceEntry) {
          payload.trace = traceEntry;
        }
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      };

      const startOverall = Date.now();

      try {
        sendSSE("progress", {
          step: "inputValidator",
          message: "Validating input ticker query...",
          status: "active",
        });

        // Fetch previous saved report for the ticker before overwriting
        const symbolClean = query.trim().toUpperCase().replace(/[^A-Z0-9\.\-]/g, "");
        let previousReportData = null;
        try {
          const previousReportEntry = await db.savedReport.findFirst({
            where: { ticker: symbolClean },
          });
          if (previousReportEntry && previousReportEntry.reportData) {
            previousReportData = JSON.parse(previousReportEntry.reportData);
          }
        } catch (dbErr) {
          console.warn("Could not fetch previous report for stability comparison:", dbErr);
        }

        // Initialize state
        const initialState = {
          ticker: query,
          companyName: "",
          financials: null,
          searchData: null,
          newsSentiment: null,
          decision: null,
          explainability: null,
          trace: [],
          progressMessage: "Started",
          previousReport: previousReportData,
        };

        // Standard step listener / generator for LangGraph
        // Since we want to update the client after each node completes:
        const workflowStream = await compiledWorkflow.stream(initialState, {
          streamMode: "updates",
        });

        let finalState: any = null;
        const completedParallel = { financials: false, search: false, news: false };
        const completedDebate = { bull: false, bear: false };

        for await (const chunk of workflowStream) {
          const nodeName = Object.keys(chunk)[0];
          const update = (chunk as any)[nodeName];
          
          traceEntry = update.trace && update.trace.length > 0 ? update.trace[0] : null;

          // Safely merge state arrays (like trace) that run in parallel
          const nextTrace = (finalState?.trace || []).concat(update.trace || []);
          finalState = { ...finalState, ...update, trace: nextTrace };

          // Stream progress message for each node
          let stepName = nodeName;
          let uiMessage = update.progressMessage || `Completed node: ${nodeName}`;

          // Map node name to clean user-facing progress steps
          if (nodeName === "inputValidator") {
            sendSSE("progress", {
              step: "inputValidator",
              message: "✓ Query Sanitized",
              status: "completed",
            });
            sendSSE("progress", {
              step: "companyResolver",
              message: "Resolving ticker symbol...",
              status: "active",
            });
          } else if (nodeName === "companyResolver") {
            sendSSE("progress", {
              step: "companyResolver",
              message: `✓ Ticker Resolved: ${update.companyName} (${update.ticker})`,
              status: "completed",
            });
            sendSSE("progress", {
              step: "financialData",
              message: "Retrieving balance sheets...",
              status: "active",
            });
            sendSSE("progress", {
              step: "businessSearch",
              message: "Analyzing competitor market share...",
              status: "active",
            });
            sendSSE("progress", {
              step: "newsSentiment",
              message: "Reading latest articles...",
              status: "active",
            });
          } else if (nodeName === "financialData") {
            completedParallel.financials = true;
            sendSSE("progress", {
              step: "financialData",
              message: "✓ Financial Statements Compiled",
              status: "completed",
            });
            if (completedParallel.financials && completedParallel.search && completedParallel.news) {
              sendSSE("progress", {
                step: "decisionEngine",
                message: "Calculating weighted ratings model...",
                status: "active",
              });
            }
          } else if (nodeName === "businessSearch") {
            completedParallel.search = true;
            sendSSE("progress", {
              step: "businessSearch",
              message: "✓ Competitive Moat Identified",
              status: "completed",
            });
            if (completedParallel.financials && completedParallel.search && completedParallel.news) {
              sendSSE("progress", {
                step: "decisionEngine",
                message: "Calculating weighted ratings model...",
                status: "active",
              });
            }
          } else if (nodeName === "newsSentimentAgent") {
            completedParallel.news = true;
            sendSSE("progress", {
              step: "newsSentiment",
              message: `✓ Sentiment Score Calibrated: ${update.newsSentiment?.score}%`,
              status: "completed",
            });
            if (completedParallel.financials && completedParallel.search && completedParallel.news) {
              sendSSE("progress", {
                step: "decisionEngine",
                message: "Calculating weighted ratings model...",
                status: "active",
              });
            }
          } else if (nodeName === "decisionEngine") {
            sendSSE("progress", {
              step: "decisionEngine",
              message: `✓ Deterministic Rating Calculated: ${update.decision?.recommendation}`,
              status: "completed",
            });
            sendSSE("progress", {
              step: "explainabilityGenerator",
              message: "Spawning Bull & Bear Analyst agents...",
              status: "active",
            });
          } else if (nodeName === "bullAnalyst") {
            completedDebate.bull = true;
            sendSSE("progress", {
              step: "explainabilityGenerator",
              message: "✓ Bullish Catalysts Outlined",
              status: "active",
            });
            if (completedDebate.bull && completedDebate.bear) {
              sendSSE("progress", {
                step: "explainabilityGenerator",
                message: "Synthesizing investment thesis via LLM...",
                status: "active",
              });
            }
          } else if (nodeName === "bearAnalyst") {
            completedDebate.bear = true;
            sendSSE("progress", {
              step: "explainabilityGenerator",
              message: "✓ Bearish Threat Assessment Compiled",
              status: "active",
            });
            if (completedDebate.bull && completedDebate.bear) {
              sendSSE("progress", {
                step: "explainabilityGenerator",
                message: "Synthesizing investment thesis via LLM...",
                status: "active",
              });
            }
          } else if (nodeName === "explainabilityGenerator") {
            sendSSE("progress", {
              step: "explainabilityGenerator",
              message: update.criticFeedback ? "✓ Report revised and approved" : "✓ Explanations & Citations Compiled",
              status: "completed",
            });
            sendSSE("progress", {
              step: "explainabilityGenerator",
              message: "Quality Auditor reviewing report...",
              status: "active",
            });
          } else if (nodeName === "reportCritic") {
            const approved = update.criticFeedback === "APPROVED";
            sendSSE("progress", {
              step: "explainabilityGenerator",
              message: approved ? "✓ Auditor Approved Draft" : `⚠ Auditor Feedback: Loop-back Revision Active`,
              status: approved ? "completed" : "active",
            });
            if (approved) {
              sendSSE("progress", {
                step: "outputFormatter",
                message: "Assembling final database payloads...",
                status: "active",
              });
            }
          } else if (nodeName === "outputFormatter") {
            sendSSE("progress", {
              step: "outputFormatter",
              message: "✓ Format Validation Complete",
              status: "completed",
            });
          }
        }

        // Finalize duration metadata
        const totalDuration = Date.now() - startOverall;
        if (finalState && finalState.report) {
          finalState.report.metadata.durationMs = totalDuration;
          finalState.report.metadata.generatedAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          
          // Save search query history in DB (associated with authenticated user)
          try {
            await db.searchHistory.create({
              data: {
                ticker: finalState.report.company.ticker,
                name: finalState.report.company.name,
                userId: user.id,
              },
            });
          } catch (dbError) {
            console.error("Failed to write to search history DB:", dbError);
          }

          // Send the final result with report and full node execution traces
          sendSSE("complete", {
            report: finalState.report,
            trace: finalState.trace || [],
          });
        } else {
          throw new Error("LangGraph finished without generating a report payload");
        }

      } catch (err: any) {
        console.error("API Research Route failed:", err);
        sendSSE("error", {
          message: err.message || "An unexpected error occurred during research",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
