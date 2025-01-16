import ky from "ky";
import { DEBUG } from "./constants";
const api = ky.extend({
  retry: {
    limit: 3,
    methods: ["GET"],
    statusCodes: [500],
    afterStatusCodes: [500],
  },
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.message || "An error occurred";

          if (DEBUG) {
            console.error("Request:", {
              url: request.url,
              method: request.method,
              headers: request.headers,
              options,
            });

            console.error("Response:", {
              status: response.status,
              statusText: response.statusText,
              body: errorData,
            });
          }

          throw new Error(errorMessage);
        }
      },
    ],
  },
});

export default api;
