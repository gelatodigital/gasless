/** JSON-RPC request structure */
export type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: unknown;
};

/** JSON-RPC response structure */
export type JsonRpcResponse<T> = {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

/** RPC client interface (mirrors viem's Transport pattern) */
export type RpcClient = {
  request: <T>(args: { method: string; params: unknown }) => Promise<T>;
};

/** Configuration for creating an RPC client */
export type RpcClientConfig = {
  baseUrl: string;
  apiKey: string;
};

/** JSON-RPC error class */
export class RpcError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'RpcError';
    this.code = code;
    this.data = data;
  }
}

/** Creates a lightweight JSON-RPC client */
export const createRpcClient = (config: RpcClientConfig): RpcClient => {
  const { baseUrl, apiKey } = config;
  let requestId = 0;

  return {
    request: async <T>(args: { method: string; params: unknown }): Promise<T> => {
      const { method, params } = args;

      const response = await fetch(baseUrl, {
        body: JSON.stringify({
          id: ++requestId,
          jsonrpc: '2.0',
          method,
          params
        } satisfies JsonRpcRequest),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        method: 'POST'
      });

      if (!response.ok) {
        throw new RpcError(-1, `HTTP error: ${response.status} ${response.statusText}`);
      }

      const json = (await response.json()) as JsonRpcResponse<T>;

      if (json.error) {
        throw new RpcError(json.error.code, json.error.message, json.error.data);
      }

      return json.result as T;
    }
  };
};
