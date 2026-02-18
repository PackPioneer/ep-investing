"use client";

import axios from "axios";
import { Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminInvestors() {
  const [investors, setInvestors] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "",
    logo: "",
    focus: "",
    website: "",
  });

  const [uploading, setUploading] = useState(false);

  // SEARCH + FILTER
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // FETCH
  const fetchData = async () => {
    try {
      const res = await axios.get("/api/investors");
      setInvestors(res.data);
      setFiltered(res.data);
    } catch {
      toast.error("Failed to load investors");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // FILTER LOGIC
  useEffect(() => {
    let data = [...investors];

    if (search) {
      data = data.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterType) {
      data = data.filter((i) => i.type === filterType);
    }

    setFiltered(data);
    setCurrentPage(1);
  }, [search, filterType, investors]);

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const currentData = filtered.slice(start, start + itemsPerPage);

  // UPLOAD
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

      toast.success("Image uploaded");
    } catch {
      toast.error("Upload Failed");
    }

    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      focus: form.focus.split(",").map((f) => f.trim()),
    };

    try {
      if (editingId) {
        await axios.put(`/api/investors/${editingId}`, payload);
        toast.success("Investor updated");
      } else {
        await axios.post("/api/investors", payload);
        toast.success("Investor added");
      }

      setForm({
        name: "",
        type: "",
        logo: "",
        focus: "",
        website: "",
      });

      setEditingId(null);
      fetchData();
    } catch {
      toast.error("Operation failed");
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Delete this investor?")) return;

    try {
      await axios.delete(`/api/investors/${id}`);
      toast.success("Deleted successfully");
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  // EDIT
  const handleEdit = (investor) => {
    setEditingId(investor._id);

    setForm({
      name: investor.name,
      type: investor.type,
      logo: investor.logo,
      focus: investor.focus?.join(", "),
      website: investor.website,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-6xl mx-auto">

      <h1 className="text-3xl font-semibold mb-6">
        Investors Admin
      </h1>



      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border mb-10 grid md:grid-cols-2 gap-6"
      >

        <input
          placeholder="Investor Name"
          className="border p-3 rounded-lg"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <select
          className="border p-3 rounded-lg"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
        >
          <option value="">Select Type</option>
          <option value="vc">VC</option>
          <option value="angel">Angel</option>
          <option value="family-office">Family Office</option>
          <option value="corporate">Corporate</option>
        </select>

        <input
          placeholder="Website URL"
          className="border p-3 rounded-lg"
          value={form.website}
          onChange={(e) =>
            setForm({ ...form, website: e.target.value })
          }
        />

        <input
          placeholder="Focus (comma separated)"
          className="border p-3 rounded-lg"
          value={form.focus}
          onChange={(e) =>
            setForm({ ...form, focus: e.target.value })
          }
        />

        {/* UPLOAD */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="md:col-span-2 border-2 border-dashed p-6 rounded-xl text-center cursor-pointer hover:bg-slate-50"
        >
          <p className="text-sm text-slate-500">
            Drag & drop logo or click
          </p>

          <input
            type="file"
            className="hidden"
            id="fileUpload"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          <label
            htmlFor="fileUpload"
            className="text-emerald-600 cursor-pointer"
          >
            Browse
          </label>

          {uploading && <p>Uploading...</p>}

          {form.logo && (
            <img
              src={form.logo}
              className="w-20 h-20 object-contain mx-auto mt-4"
            />
          )}
        </div>

        <button className="md:col-span-2 bg-emerald-600 text-white py-3 rounded-lg">
          {editingId ? "Update Investor" : "Add Investor"}
        </button>
      </form>

      {/* 🔍 SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">

        <input
          placeholder="Search investors..."
          className="border p-3 rounded-lg w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-3 rounded-lg"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="vc">VC</option>
          <option value="angel">Angel</option>
          <option value="family-office">Family Office</option>
          <option value="corporate">Corporate</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-4">Logo</th>
              <th>Name</th>
              <th>Type</th>
              <th>Website</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {currentData.map((i) => (
              <tr key={i._id} className="border-t">

                <td className="p-4">
                  {i.logo && (
                    <img
                      src={i.logo}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                </td>

                <td>{i.name}</td>
                <td>{i.type}</td>

                <td>
                  {i.website && (
                    <a
                      href={i.website}
                      target="_blank"
                      className="text-blue-600"
                    >
                      Visit
                    </a>
                  )}
                </td>

                <td className="space-x-3">
                  <button
                    onClick={() => handleEdit(i)}
                    className="text-blue-600"
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(i._id)}
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
      <div className="flex justify-center mt-6 gap-2">

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-3 py-1 border rounded"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`px-3 py-1 border rounded ${
              currentPage === p ? "bg-emerald-600 text-white" : ""
            }`}
          >
            {p}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>

      </div>

    </div>
  );
}
