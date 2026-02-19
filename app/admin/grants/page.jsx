"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminGrants() {
  const [grants, setGrants] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    funder: "",
    deadline: "",
    amountMin: "",
    amountMax: "",
    tags: "",
    link: "",
  });

  // SEARCH + FILTER + PAGINATION
  const [search, setSearch] = useState("");
  const [funderFilter, setFunderFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;

  // FETCH
  const fetchData = async () => {
    try {
      const res = await axios.get("/api/grants");
      setGrants(res.data);
    } catch {
      toast.error("Failed to fetch grants");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()),
      amountMin: Number(form.amountMin),
      amountMax: Number(form.amountMax),
      deadline: form.deadline || null,
    };

    try {
      if (editingId) {
        await axios.put(`/api/grants/${editingId}`, payload);
        toast.success("Grant updated");
      } else {
        await axios.post("/api/grants", payload);
        toast.success("Grant created");
      }

      setForm({
        title: "",
        funder: "",
        deadline: "",
        amountMin: "",
        amountMax: "",
        tags: "",
        link: "",
      });

      setEditingId(null);
      fetchData();
    } catch {
      toast.error("Something went wrong");
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Delete this grant?")) return;

    try {
      await axios.delete(`/api/grants/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  // EDIT
  const handleEdit = (g) => {
    setEditingId(g._id);

    setForm({
      title: g.title,
      funder: g.funder,
      deadline: g.deadline
        ? new Date(g.deadline).toISOString().split("T")[0]
        : "",
      amountMin: g.amountMin || "",
      amountMax: g.amountMax || "",
      tags: g.tags?.join(", "),
      link: g.link,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // FILTERING
  const filtered = grants.filter((g) => {
    return (
      g.title.toLowerCase().includes(search.toLowerCase()) &&
      (funderFilter
        ? g.funder?.toLowerCase().includes(funderFilter.toLowerCase())
        : true)
    );
  });

  // PAGINATION
  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice(
    (page - 1) * limit,
    page * limit
  );

  return (
    <div className="max-w-6xl mx-auto">

      <h1 className="text-3xl font-semibold mb-8">
        Grants Admin
      </h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border mb-10 grid md:grid-cols-2 gap-6"
      >

        <input
          placeholder="Grant Title"
          className="border p-3 rounded-lg"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <input
          placeholder="Funder (e.g. DOE)"
          className="border p-3 rounded-lg"
          value={form.funder}
          onChange={(e) =>
            setForm({ ...form, funder: e.target.value })
          }
        />

        <input
          type="date"
          className="border p-3 rounded-lg"
          value={form.deadline}
          onChange={(e) =>
            setForm({ ...form, deadline: e.target.value })
          }
        />

        <input
          placeholder="Apply Link"
          className="border p-3 rounded-lg"
          value={form.link}
          onChange={(e) =>
            setForm({ ...form, link: e.target.value })
          }
        />

        <input
          placeholder="Min Amount"
          type="number"
          className="border p-3 rounded-lg"
          value={form.amountMin}
          onChange={(e) =>
            setForm({ ...form, amountMin: e.target.value })
          }
        />

        <input
          placeholder="Max Amount"
          type="number"
          className="border p-3 rounded-lg"
          value={form.amountMax}
          onChange={(e) =>
            setForm({ ...form, amountMax: e.target.value })
          }
        />

        <input
          placeholder="Tags (comma separated)"
          className="border p-3 rounded-lg md:col-span-2"
          value={form.tags}
          onChange={(e) =>
            setForm({ ...form, tags: e.target.value })
          }
        />

        <button className="md:col-span-2 bg-emerald-600 text-white py-3 rounded-lg">
          {editingId ? "Update Grant" : "Add Grant"}
        </button>

      </form>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        <input
          placeholder="Search grants..."
          className="border p-3 rounded-lg w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          placeholder="Filter by funder..."
          className="border p-3 rounded-lg"
          value={funderFilter}
          onChange={(e) => setFunderFilter(e.target.value)}
        />

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-4">Title</th>
              <th>Funder</th>
              <th>Deadline</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((g) => (
              <tr key={g._id} className="border-t">

                <td className="p-4">{g.title}</td>
                <td>{g.funder}</td>

                <td>
                  {g.deadline
                    ? new Date(g.deadline).toLocaleDateString()
                    : "-"}
                </td>

                <td>
                  {g.amountMin && g.amountMax
                    ? `${g.amountMin} - ${g.amountMax}`
                    : "-"}
                </td>

                <td className="space-x-3">

                  <button
                    onClick={() => handleEdit(g)}
                    className="text-blue-600"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(g._id)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>

                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center gap-3 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded"
        >
          Prev
        </button>

        <span className="px-3 py-2">
          {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded"
        >
          Next
        </button>
      </div>

    </div>
  );
}
