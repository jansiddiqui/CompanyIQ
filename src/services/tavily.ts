export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

// Robust fallback search results for testing without a Tavily API key
const mockSearchQueries: Record<string, SearchResult[]> = {
  AAPL: [
    {
      title: "Apple Inc. Business Model & Strategy Overview",
      url: "https://www.apple.com/investor/",
      content: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories. Its business model relies on integrated hardware, software, services (Apple Music, iCloud, Apple Pay), and a strong ecosystem. Principal growth drivers include services expansion and premium hardware pricing.",
      score: 0.98
    },
    {
      title: "Apple Competitor Analysis and Market Share",
      url: "https://finance.yahoo.com/quote/AAPL",
      content: "Apple's key competitors in smartphones include Samsung, Xiaomi, and Huawei. In personal computing (Mac), key competitors include Microsoft, Lenovo, HP, and Dell. In wearables and smart home systems, competitors include Google, Amazon, and Sony. Apple maintains a high premium brand moat.",
      score: 0.95
    },
    {
      title: "Apple acquisitions and AI expansion plans",
      url: "https://www.bloomberg.com/apple",
      content: "Apple has acquired several AI startups (e.g., DarwinAI) to boost its on-device machine learning capabilities. They are expanding into Generative AI features (Apple Intelligence) integrated into iOS 18 and macOS Sequoia, partnering with OpenAI for external LLM lookups.",
      score: 0.92
    }
  ],
  MSFT: [
    {
      title: "Microsoft Corporation Business Model and Segment Revenue",
      url: "https://www.microsoft.com/investor/",
      content: "Microsoft operates in three main segments: Productivity and Business Processes (Office, LinkedIn), Intelligent Cloud (Azure server products and cloud services), and More Personal Computing (Windows, Devices, Gaming/Xbox). Azure cloud services are the main driver of growth.",
      score: 0.99
    },
    {
      title: "Microsoft Cloud Competition and AI Dominance",
      url: "https://finance.yahoo.com/quote/MSFT",
      content: "Microsoft's cloud business, Azure, competes directly with Amazon Web Services (AWS) and Google Cloud Platform (GCP). In operating systems, it competes with Apple and Linux. In enterprise software and CRM, competitors include Salesforce and Oracle. OpenAI partnership gives it an AI edge.",
      score: 0.96
    },
    {
      title: "Microsoft Activision Blizzard acquisition details",
      url: "https://www.reuters.com/microsoft",
      content: "Microsoft completed its $68.7 billion acquisition of Activision Blizzard, establishing a major footprint in gaming and expanding Xbox Game Pass content library. It is also investing heavily in global data center capacity to run Microsoft Copilot services.",
      score: 0.93
    }
  ],
  NVDA: [
    {
      title: "NVIDIA AI Dominance, GPUs, and Computing Platforms",
      url: "https://investor.nvidia.com/",
      content: "NVIDIA Corporation operates in two segments: Compute & Networking (including AI enterprise platforms, Hopper/Blackwell GPUs, CUDA software) and Graphics (GeForce GPUs for gaming). AI GPU hardware accounts for over 80% of data center revenue.",
      score: 0.99
    },
    {
      title: "NVIDIA Competitors in AI Chips and Hardware",
      url: "https://finance.yahoo.com/quote/NVDA",
      content: "NVIDIA's primary GPU competitor is Advanced Micro Devices (AMD) and Intel. In custom AI silicon (TPUs/ASICs), competitors include cloud service providers designing custom chips: Google (TPU), Amazon (Trainium), and Microsoft (Maia). NVIDIA's CUDA software creates a high entry barrier.",
      score: 0.97
    },
    {
      title: "NVIDIA Blackwell GPU platform release and sales",
      url: "https://www.bloomberg.com/nvidia",
      content: "NVIDIA announced Blackwell architecture (B200/GB200) offering 30x faster LLM inference and 25x lower energy consumption than Hopper. Demand is expected to outstrip supply through 2026. The company is actively investing in AI software layers.",
      score: 0.94
    }
  ],
  TSLA: [
    {
      title: "Tesla Business Model, EV Manufacturing and Energy Storage",
      url: "https://ir.tesla.com/",
      content: "Tesla Inc. designs, develops, manufactures, and sells fully electric vehicles (Model Y, 3, S, X, Cybertruck), energy generation and storage systems (Powerwall, Megapack). Its business model features direct-to-consumer sales, proprietary Supercharger network, and software sales (FSD).",
      score: 0.98
    },
    {
      title: "Tesla Competitors in Electric Vehicles and Autonomous Driving",
      url: "https://finance.yahoo.com/quote/TSLA",
      content: "Tesla faces intensive competition in China from BYD, Li Auto, and Xiaomi, and globally from traditional OEMs (VW, GM, Ford) and premium EV brands (BMW, Mercedes). In autonomous driving software, it competes with Waymo (Alphabet) and Zoox (Amazon).",
      score: 0.94
    },
    {
      title: "Tesla robotaxi platform and full self driving strategy",
      url: "https://www.cnbc.com/tesla",
      content: "Tesla is shifting priority toward robotaxis and AI training clusters (using NVIDIA H100s and custom Dojo chips). FSD version 12 introduces end-to-end neural network controls, driving growth in paid subscription subscriptions.",
      score: 0.91
    }
  ]
};

export async function searchTavily(query: string, maxResults = 5): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;

  // Detect ticker in query to offer highly relevant mock results
  const uppercaseQuery = query.toUpperCase();
  let detectedTicker = "AAPL";
  if (uppercaseQuery.includes("MSFT") || uppercaseQuery.includes("MICROSOFT")) detectedTicker = "MSFT";
  else if (uppercaseQuery.includes("NVDA") || uppercaseQuery.includes("NVIDIA")) detectedTicker = "NVDA";
  else if (uppercaseQuery.includes("TSLA") || uppercaseQuery.includes("TESLA")) detectedTicker = "TSLA";

  if (!apiKey) {
    console.warn("Tavily API key is missing. Using cached search database for query: " + query);
    
    // Return mock results based on query matches
    const results = mockSearchQueries[detectedTicker] || mockSearchQueries.AAPL;
    return {
      query,
      results: results.slice(0, maxResults)
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_images: false,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Tavily API returned status ${response.status}`);
    }

    const data = await response.json();
    return {
      query: data.query || query,
      results: (data.results || []).map((r: any) => ({
        title: r.title || "No Title",
        url: r.url || "",
        content: r.content || "",
        score: r.score || 0.5,
      })),
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Tavily Search API failure: " + error.message + ". Falling back to mock results.");
    const results = mockSearchQueries[detectedTicker] || mockSearchQueries.AAPL;
    return {
      query,
      results: results.slice(0, maxResults)
    };
  }
}
