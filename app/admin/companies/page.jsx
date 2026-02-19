"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    logo: "",
    description: "",
    tags: "",
    website: "",
    stage: "",
    location: "",
  });

  const [uploading, setUploading] = useState(false);

  // SEARCH + FILTER + PAGINATION
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 5;

  // FETCH
  const fetchData = async () => {
    try {
      const res = await axios.get("/api/companies");
      setCompanies(res.data);
    } catch {
      toast.error("Failed to fetch companies");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // FILE UPLOAD
  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("/api/upload", formData);

      setForm((prev) => ({
        ...prev,
        logo: res.data.url,
      }));

      toast.success("Logo uploaded");
    } catch {
      toast.error("Upload failed");
    }

    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files[0]);
  };

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()),
    };

    try {
      if (editingId) {
        await axios.put(`/api/companies/${editingId}`, payload);
        toast.success("Company updated");
      } else {
        await axios.post("/api/companies", payload);
        toast.success("Company added");
      }

      setForm({
        name: "",
        logo: "",
        description: "",
        tags: "",
        website: "",
        stage: "",
        location: "",
      });

      setEditingId(null);
      fetchData();
    } catch {
      toast.error("Something went wrong");
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Delete this company?")) return;

    try {
      await axios.delete(`/api/companies/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  // EDIT
  const handleEdit = (c) => {
    setEditingId(c._id);

    setForm({
      name: c.name,
      logo: c.logo,
      description: c.description,
      tags: c.tags?.join(", "),
      website: c.website,
      stage: c.stage,
      location: c.location,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // FILTERING
  const filtered = companies.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      (stageFilter ? c.stage === stageFilter : true)
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
        Companies Admin
      </h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border mb-10 grid md:grid-cols-2 gap-6"
      >

        <input
          placeholder="Company Name"
          className="border p-3 rounded-lg"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <select
          className="border p-3 rounded-lg"
          value={form.stage}
          onChange={(e) =>
            setForm({ ...form, stage: e.target.value })
          }
        >
          <option value="">Select Stage</option>
          <option value="pre-seed">Pre-Seed</option>
          <option value="seed">Seed</option>
          <option value="series-a">Series A</option>
          <option value="growth">Growth</option>
        </select>

        <input
          placeholder="Website"
          className="border p-3 rounded-lg"
          value={form.website}
          onChange={(e) =>
            setForm({ ...form, website: e.target.value })
          }
        />

        <input
          placeholder="Location"
          className="border p-3 rounded-lg"
          value={form.location}
          onChange={(e) =>
            setForm({ ...form, location: e.target.value })
          }
        />

        <textarea
          placeholder="Description"
          className="border p-3 rounded-lg md:col-span-2"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
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

        {/* UPLOAD */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="md:col-span-2 border-2 border-dashed p-6 rounded-xl text-center"
        >
          <p>Drag & drop logo or click</p>

          <input
            type="file"
            className="hidden"
            id="fileUpload"
            onChange={(e) =>
              handleFileUpload(e.target.files[0])
            }
          />

          <label htmlFor="fileUpload" className="cursor-pointer text-emerald-600">
            Browse
          </label>

          {uploading && <p>Uploading...</p>}

          {form.logo && (
            <img
              src={form.logo}
              className="w-20 h-20 object-contain mx-auto mt-3"
            />
          )}
        </div>

        <button className="md:col-span-2 bg-emerald-600 text-white py-3 rounded-lg">
          {editingId ? "Update Company" : "Add Company"}
        </button>

      </form>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        <input
          placeholder="Search company..."
          className="border p-3 rounded-lg w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-3 rounded-lg"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All Stages</option>
          <option value="pre-seed">Pre-Seed</option>
          <option value="seed">Seed</option>
          <option value="series-a">Series A</option>
          <option value="growth">Growth</option>
        </select>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-4">Logo</th>
              <th>Name</th>
              <th>Stage</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((c) => (
              <tr key={c._id} className="border-t">

                <td className="p-4">
                  {c.logo && (
                    <img src={c.logo} className="w-12 h-12 object-contain" />
                  )}
                </td>

                <td>{c.name}</td>
                <td>{c.stage}</td>
                <td>{c.location}</td>

                <td className="space-x-3">

                  <button
                    onClick={() => handleEdit(c)}
                    className="text-blue-600"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(c._id)}
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
