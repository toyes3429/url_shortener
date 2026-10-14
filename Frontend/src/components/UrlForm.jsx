import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createShortUrl } from "../api/shortUrl.api";

const getMinimumExpiration = () => {
  const date = new Date(Date.now() + 60000);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const UrlForm = () => {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createShortUrl(url.trim(), customSlug.trim(), expiresAt),
    onSuccess: (result) => {
      setShortUrl(result);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["userUrls"] });
    },
    onError: (err) => {
      setError(err.message || "Could not create the short URL.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setShortUrl("");
    setError("");
    createMutation.mutate();
  };

  const handleCopy = async () => {
    if (!shortUrl) return;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the URL. Please copy it manually.");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="mb-1 block text-sm font-medium text-gray-700">
            Destination URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/your-long-url"
            required
            maxLength={2048}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="customSlug" className="mb-1 block text-sm font-medium text-gray-700">
            Custom slug (optional)
          </label>
          <input
            type="text"
            id="customSlug"
            value={customSlug}
            onChange={(event) => setCustomSlug(event.target.value)}
            placeholder="my-custom-link"
            minLength={3}
            maxLength={32}
            pattern="[a-zA-Z0-9_-]{3,32}"
            title="Use 3–32 letters, numbers, hyphens, or underscores."
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="expiresAt" className="mb-1 block text-sm font-medium text-gray-700">
            Expiration (optional)
          </label>
          <input
            type="datetime-local"
            id="expiresAt"
            value={expiresAt}
            min={getMinimumExpiration()}
            onChange={(event) => setExpiresAt(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">Leave empty for a link that does not expire.</p>
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {createMutation.isPending ? "Creating..." : "Shorten URL"}
        </button>
      </form>

      {error && (
        <div role="alert" className="rounded-md bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {shortUrl && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <h2 className="mb-2 font-semibold text-green-900">Your shortened URL</h2>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shortUrl}
              aria-label="Shortened URL"
              className="min-w-0 flex-1 rounded-md border border-green-200 bg-white p-2"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <a
              href={shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlForm;
