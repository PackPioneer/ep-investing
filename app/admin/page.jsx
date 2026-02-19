"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Card from "./components/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const filters = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "28 Days", value: "28d" },
  { label: "1 Year", value: "1y" },
  { label: "Lifetime", value: "all" },
];

const chartTabs = [
  { label: "Investors", value: "investors" },
  { label: "Companies", value: "companies" },
  { label: "Grants", value: "grants" },
  { label: "Subscribers", value: "subscribers" },
];

export default function AdminDashboard() {
  const [filter, setFilter] = useState("7d");
  const [stats, setStats] = useState(null);
  const [chartType, setChartType] = useState("investors");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchStats();
  }, [filter]);

  useEffect(() => {
    fetchChart();
  }, [chartType]);

  const fetchStats = async () => {
    const res = await axios.get(`/api/admin/stats?filter=${filter}`);
    setStats(res.data);
  };

  const fetchChart = async () => {
    const res = await axios.get(
      `/api/admin/chart?type=${chartType}`
    );
    setChartData(res.data);
  };

  const formatGrowth = (g) => {
    if (g > 0) return `+${g.toFixed(1)}%`;
    return `${g.toFixed(1)}%`;
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Dashboard</h1>

        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-lg text-sm ${
                filter === f.value
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">

          <Card
            title="Investors"
            value={stats.investors.current}
            growth={formatGrowth(stats.investors.growth)}
          />

          <Card
            title="Companies"
            value={stats.companies.current}
            growth={formatGrowth(stats.companies.growth)}
          />

          <Card
            title="Grants"
            value={stats.grants.current}
            growth={formatGrowth(stats.grants.growth)}
          />

          <Card
            title="Subscribers"
            value={stats.subscribers.current}
            growth={formatGrowth(stats.subscribers.growth)}
          />

        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl border shadow-sm">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">
            Growth Analytics
          </h2>

          {/* Chart Tabs */}
          <div className="flex gap-2 flex-wrap">
            {chartTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setChartType(tab.value)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  chartType === tab.value
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}
