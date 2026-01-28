import Replicate from "replicate";

let replicateClient: Replicate | null = null;

export function getReplicateClient(): Replicate {
  if (!replicateClient) {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      throw new Error("REPLICATE_API_TOKEN is not defined");
    }
    replicateClient = new Replicate({ auth: apiToken });
  }
  return replicateClient;
}
