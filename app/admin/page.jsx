"use client";

import Card from "./components/Card";
import Chart from "./components/Chart";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const filters = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "28 Days", value: "28d" },
  { label: "1 Year", value: "1y" },
  { label: "Lifetime", value: "lifetime" },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("lifetime");
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async (selectedRange = range) => {
    setLoading(true);

    try {
      const res = await axios.get(`/api/dashboard?range=${selectedRange}`);
      setData(res.data);
    } catch (err) {
      toast.error("Failed to load dashboard");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleFilter = (value) => {
    setRange(value);
    fetchDashboard(value);
  };

  if (!data) return <p>Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto">

      <h1 className="text-3xl font-semibold mb-6">Dashboard</h1>

      {/* FILTERS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`px-4 py-2 rounded-lg border text-sm ${
              range === f.value
                ? "bg-emerald-600 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card title="Investors" value={data.totals.investors} />
        <Card title="Companies" value={data.totals.companies} />
        <Card title="Grants" value={data.totals.grants} />
        <Card title="Subscribers" value={data.totals.subscribers} />
      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-6">

        <Chart
          title="Investors Growth"
          data={data.charts.investors}
        />

        <Chart
          title="Companies Growth"
          data={data.charts.companies}
        />

        <Chart
          title="Grants Growth"
          data={data.charts.grants}
        />

        <Chart
          title="Subscribers Growth"
          data={data.charts.subscribers}
        />

      </div>

    </div>
  );
}
