"use client";

import Card from "./components/Card";

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto">

      <h1 className="text-3xl font-semibold mb-8">
        Dashboard
      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        <Card title="Investors" value="120+" />
        <Card title="Companies" value="80+" />
        <Card title="Grants" value="45+" />

      </div>

    </div>
  );
}
