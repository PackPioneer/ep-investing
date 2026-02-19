"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Chart({ data, title }) {
  const formatted = data.map((item) => ({
    date: item._id,
    value: item.count,
  }));

  return (
    <div className="bg-white p-5 rounded-xl border">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
