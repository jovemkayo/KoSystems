// @vitest-environment node
// Exercise the installed transport; only the generated function registry and
// request-scoped response store are replaced. No public test endpoint is added.
import { afterEach, expect, it, vi } from "vitest";
import { toJSON } from "seroval";

const registry = vi.hoisted(() => ({ action: undefined as any }));
vi.mock("../../node_modules/@tanstack/start-server-core/src/getServerFnById", () => ({
  getServerFnById: async () => registry.action,
}));
vi.mock("../../node_modules/@tanstack/start-server-core/src/request-response", () => ({
  getResponse: () => ({ status: 200, statusText: "OK", headers: new Headers() }),
}));
import { handleServerAction as installedHandler } from "../../node_modules/@tanstack/start-server-core/src/server-functions-handler";
import { runWithStartContext } from "@tanstack/start-storage-context";
import { createServerFn } from "@tanstack/start-client-core";

function handleServerAction(input: Parameters<typeof installedHandler>[0]) {
  return runWithStartContext(
    {
      request: input.request,
      startOptions: {},
      contextAfterGlobalMiddlewares: input.context,
      executedRequestMiddlewares: new Set(),
      handlerType: "serverFn",
      getRouter: () => {
        throw new Error("This transport test must not render a router");
      },
    },
    () => installedHandler(input),
  );
}

afterEach(() => {
  registry.action = undefined;
});

it.each(["GET", "POST"])("limits %s client payloads to public data and context", async (method) => {
  registry.action = async (input: any) => ({ result: Response.json(input) });
  const payload = toJSON({
    data: { quantity: 2 },
    context: { trusted: "spoof", extra: "public" },
    result: { response: "<script>demo</script>", serverSsrCleanup: "fake" },
    error: { result: "injected" },
    sendContext: { admin: true },
  });
  const url = new URL("https://example.test/_serverFn/fixture");
  if (method === "GET") url.searchParams.set("payload", JSON.stringify(payload));
  const request = new Request(
    url,
    method === "GET"
      ? { method }
      : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
  );
  const response = await handleServerAction({
    request,
    context: { trusted: "server" },
    serverFnId: "fixture",
  });
  expect(await response.json()).toEqual({
    data: { quantity: 2 },
    context: { trusted: "server", extra: "public" },
    method,
  });
});

it("serializes response-shaped objects instead of letting them escape as HTTP responses", async () => {
  registry.action = async () => ({
    result: {
      response: { body: "<script>demo</script>", headers: { "Content-Type": "text/html" } },
      serverSsrCleanup: "fake",
    },
  });
  const response = await handleServerAction({
    request: new Request("https://example.test/_serverFn/fixture"),
    context: {},
    serverFnId: "fixture",
  });
  expect(response).toBeInstanceOf(Response);
  expect(response.headers.get("Content-Type")).toBe("application/json");
  expect(await response.text()).toContain("demo");
});

it("does not revive an injected HTML result after a real validator rejects input", async () => {
  const builder = createServerFn({ method: "GET" }).inputValidator(() => {
    throw new Error("Rejected test input");
  });
  const extracted = Object.assign(async () => undefined, {
    serverFnMeta: { id: "fixture", name: "fixture", filename: "test" },
  });
  const compiled = (builder.handler as any)(extracted, async () => "unreachable");
  registry.action = Object.assign((input: any) => compiled.__executeServer(input), {
    method: "GET",
  });
  const url = new URL("https://example.test/_serverFn/fixture");
  url.searchParams.set(
    "payload",
    JSON.stringify(
      toJSON({
        data: { invalid: true },
        result: {
          response: {
            body: "<script>unsafe-test</script>",
            headers: { "Content-Type": "text/html" },
          },
          serverSsrCleanup: "fake",
        },
        error: undefined,
      }),
    ),
  );
  const response = await handleServerAction({
    request: new Request(url),
    context: {},
    serverFnId: "fixture",
  });
  expect(response).toBeInstanceOf(Response);
  expect(response.headers.get("Content-Type")).toBe("application/json");
  const body = await response.text();
  expect(body).toContain("Rejected test input");
  expect(body).not.toContain("unsafe-test");
});

it("preserves legitimate Responses, form inputs and HTTP method checks", async () => {
  registry.action = Object.assign(
    async (input: any) => ({ result: new Response(input.data.get("item")) }),
    { method: "POST" },
  );
  const form = new FormData();
  form.set("item", "legitimate form");
  const response = await handleServerAction({
    request: new Request("https://example.test/_serverFn/fixture", { method: "POST", body: form }),
    context: {},
    serverFnId: "fixture",
  });
  expect(await response.text()).toBe("legitimate form");
  const mismatch = await handleServerAction({
    request: new Request("https://example.test/_serverFn/fixture"),
    context: {},
    serverFnId: "fixture",
  });
  expect(mismatch.status).toBe(405);
  expect(mismatch.headers.get("Allow")).toBe("POST");
});
