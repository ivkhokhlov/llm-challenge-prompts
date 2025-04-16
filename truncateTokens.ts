// truncate.ts

import { encoding_for_model, Tiktoken } from "tiktoken";

async function truncateToNTokens(
  text: string,
  maxTokens: number = 1000,
  model: string = "gpt4o"
): Promise<string> {
  // 1. Load the tokenizer for GPT‑4 O
  const enc: Tiktoken = await encoding_for_model(model);

  try {
    // 2. Encode the text into token IDs
    const tokenIds: number[] = enc.encode(text);

    // 3. If already within the limit, return as‑is
    if (tokenIds.length <= maxTokens) {
      return text;
    }

    // 4. Otherwise, slice off to maxTokens
    const truncatedIds = tokenIds.slice(0, maxTokens);

    // 5. Decode back to a UTF‑8 string (drops partial tokens safely)
    return enc.decode(truncatedIds);
  } finally {
    // 6. Free WebAssembly memory when done
    enc.free();
  }
}

// Example usage
(async () => {
  const longText = `Your very long string…`;
  const shortText = await truncateToNTokens(longText, 1000);
  console.log("Original token count:", (await encoding_for_model("gpt4o")).encode(longText).length);
  console.log("Truncated token count:", (await encoding_for_model("gpt4o")).encode(shortText).length);
})();
