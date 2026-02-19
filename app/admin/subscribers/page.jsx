"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Trash2, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // FETCH
  const fetchData = async () => {
    try {
      const res = await axios.get("/api/newsletter");
      setSubscribers(res.data);
    } catch {
      toast.error("Failed to fetch subscribers");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Delete this subscriber?")) return;

    try {
      await axios.delete(`/api/newsletter/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  // SEARCH FILTER
  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  // PAGINATION
  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice(
    (page - 1) * limit,
    page * limit
  );

  // EXPORT CSV
  const handleExport = () => {
    const rows = [
      ["Email", "Subscribed At"],
      ...filtered.map((s) => [
        s.email,
        new Date(s.createdAt).toLocaleString(),
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "subscribers.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV Downloaded");
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">
          Subscribers
        </h1>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-6">
        <input
          placeholder="Search by email..."
          className="w-full border p-3 rounded-lg"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 text-left">
            <tr className="text-nowrap">
              <th className="p-4">Email</th>
              <th>Subscribed At</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((s) => (
              <tr key={s._id} className="border-t">

                <td className="p-4">{s.email}</td>

                <td>
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>

                <td>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>

              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan="3" className="p-6 text-center text-gray-500">
                  No subscribers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-3 mt-6">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="px-3 py-2">
          {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  );
}
