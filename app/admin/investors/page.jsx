"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function AdminInvestors() {

  const [investors, setInvestors] = useState([]);
  const [form, setForm] = useState({
    name: "",
    type: "",
    logo: "",
  });

  const fetchData = async () => {
    const res = await axios.get("/api/investors");
    setInvestors(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CREATE
  const handleSubmit = async (e) => {
    e.preventDefault();

    await axios.post("/api/investors", form);

    setForm({ name: "", type: "", logo: "" });
    fetchData();
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!confirm("Delete this investor?")) return;

    await axios.delete(`/api/investors/${id}`);
    fetchData();
  };

  return (
    <div>

      <h1 className="text-3xl font-semibold mb-8">
        Investors
      </h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border mb-10 grid md:grid-cols-3 gap-4"
      >
        <input
          placeholder="Name"
          className="border p-3 rounded-lg"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Type"
          className="border p-3 rounded-lg"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value })
          }
        />

        <input
          placeholder="Logo URL"
          className="border p-3 rounded-lg"
          value={form.logo}
          onChange={(e) =>
            setForm({ ...form, logo: e.target.value })
          }
        />

        <button className="md:col-span-3 bg-emerald-600 text-white py-3 rounded-lg">
          Add Investor
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-4">Name</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {investors.map((i) => (
              <tr key={i._id} className="border-t">
                <td className="p-4">{i.name}</td>
                <td>{i.type}</td>

                <td>
                  <button
                    onClick={() => handleDelete(i._id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

    </div>
  );
}
