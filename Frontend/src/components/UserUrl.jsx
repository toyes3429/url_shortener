import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteUserUrl,
  getAllUserUrls,
  updateUserUrl,
} from "../api/user.api";

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const UserUrl = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editUrl, setEditUrl] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [actionError, setActionError] = useState("");
  const appUrl = (import.meta.env.VITE_APP_URL || "http://localhost:5000").replace(/\/$/, "");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["userUrls", page],
    queryFn: () => getAllUserUrls(page, 10),
    refetchInterval: 30000,
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });

  const refreshUrls = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userUrls"] });
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateUserUrl(id, updates),
    onSuccess: async () => {
      setEditingId(null);
      setActionError("");
      await refreshUrls();
    },
    onError: (err) => setActionError(err.message || "Could not update this link."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserUrl,
    onSuccess: async () => {
      setActionError("");
      const currentCount = data?.urls?.length ?? 0;
      if (currentCount === 1 && page > 1) setPage((currentPage) => currentPage - 1);
      await refreshUrls();
    },
    onError: (err) => setActionError(err.message || "Could not delete this link."),
  });

  const handleCopy = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setActionError("Could not copy the URL. Please copy it manually.");
    }
  };

  const startEditing = (url) => {
    setEditingId(url._id);
    setEditUrl(url.full_url);
    setEditExpiresAt(toLocalDateTime(url.expires_at));
    setActionError("");
  };

  const saveEdit = (event, id) => {
    event.preventDefault();
    const updates = {
      url: editUrl.trim(),
      expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
    };
    updateMutation.mutate({ id, updates });
  };

  if (isLoading) {
    return (
      <div className="my-8 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="my-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
        Error loading your URLs: {error.message}
      </div>
    );
  }

  const urls = data?.urls ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    total: urls.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  return (
    <section className="mt-6 overflow-hidden rounded-lg bg-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your links</h2>
          <p className="text-sm text-gray-500">{pagination.total} total links</p>
        </div>
        <span className="text-sm text-gray-500">Page {pagination.page} of {Math.max(1, pagination.totalPages)}</span>
      </div>

      {actionError && (
        <div role="alert" className="m-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {urls.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="font-medium">No URLs found</p>
          <p className="mt-1 text-sm">Create your first short link above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Destination</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Short URL</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Clicks</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Expires</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {urls.map((url) => {
                const shortUrl = `${appUrl}/${url.short_url}`;
                const isEditing = editingId === url._id;

                return (
                  <tr key={url._id} className="align-top hover:bg-gray-50">
                    <td className="max-w-sm px-5 py-4">
                      {isEditing ? (
                        <form onSubmit={(event) => saveEdit(event, url._id)} className="min-w-64 space-y-2">
                          <label className="sr-only" htmlFor={`edit-url-${url._id}`}>Destination URL</label>
                          <input
                            id={`edit-url-${url._id}`}
                            type="url"
                            required
                            maxLength={2048}
                            value={editUrl}
                            onChange={(event) => setEditUrl(event.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                          <label className="block text-xs text-gray-500" htmlFor={`edit-expiry-${url._id}`}>Expiration (optional)</label>
                          <input
                            id={`edit-expiry-${url._id}`}
                            type="datetime-local"
                            value={editExpiresAt}
                            onChange={(event) => setEditExpiresAt(event.target.value)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={updateMutation.isPending}
                              className="rounded bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                            >
                              {updateMutation.isPending ? "Saving..." : "Save"}
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded bg-gray-200 px-3 py-1 text-xs">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="break-all text-sm text-gray-900">{url.full_url}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="break-all text-blue-600 hover:underline">
                        {shortUrl}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        {url.clicks} {url.clicks === 1 ? "click" : "clicks"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {url.expires_at ? new Date(url.expires_at).toLocaleString() : "Never"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(shortUrl, url._id)}
                          className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          {copiedId === url._id ? "Copied!" : "Copy"}
                        </button>
                        {!isEditing && (
                          <button type="button" onClick={() => startEditing(url)} className="rounded bg-gray-200 px-3 py-1.5 text-xs font-medium hover:bg-gray-300">
                            Edit
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm("Delete this short link? This cannot be undone.")) {
                              deleteMutation.mutate(url._id);
                            }
                          }}
                          className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t px-5 py-4">
        <button
          type="button"
          disabled={!pagination.hasPreviousPage}
          onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          className="rounded border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-xs text-gray-500">{pagination.total} links</span>
        <button
          type="button"
          disabled={!pagination.hasNextPage}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          className="rounded border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default UserUrl;
