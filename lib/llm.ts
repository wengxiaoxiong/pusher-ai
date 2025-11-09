import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";

const llm = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
})

const moonshot = createOpenAI({
  baseURL: "https://api.moonshot.cn/v1",
  apiKey: process.env.MOONSHOT_API_KEY,
  
})

const minimax = createOpenAI({
  baseURL: "https://api.minimaxi.com/v1",
  apiKey: process.env.MINIMAX_API_KEY,
  
})

export { llm, moonshot, minimax }