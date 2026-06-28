import { query } from "./_generated/server";

// Connection smoke-test.
export const hello = query({
  args: {},
  handler: async () => "pong",
});
