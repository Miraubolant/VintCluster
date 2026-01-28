import Replicate from "replicate";

let replicateClient: Replicate | null = null;

export function getReplicateClient(): Replicate {
  if (!replicateClient) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error("REPLICATE_API_TOKEN is not defined");
    }
    // Désactiver FileOutput pour recevoir des URLs directes au lieu de ReadableStream
    replicateClient = new Replicate({
      auth: apiToken,
      useFileOutput: false,
    });
  }
  return replicateClient;
}
