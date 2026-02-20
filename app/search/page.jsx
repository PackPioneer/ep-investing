"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [data, setData] = useState({
    investors: [],
    companies: [],
    grants: [],
  });

  const [loading, setLoading] = useState(false);

  // 🔥 Fetch from your API
  useEffect(() => {
    if (!query) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/search?q=${query}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    fetchData();
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 min-h-screen">

      {/* Title */}
      <h1 className="text-3xl font-semibold mb-8">
        Results for "{query}"
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* ================= INVESTORS ================= */}
          {data.investors?.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Investors</h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.investors.map((i) => (
                  <Link
                    key={i._id}
                    href={`/investors/${i._id}`}
                    className="border rounded-xl p-4 hover:shadow"
                  >
                    <h3 className="font-medium">{i.name}</h3>

                    {i.type && (
                      <p className="text-sm text-emerald-600">
                        {i.type}
                      </p>
                    )}

                    {i.focus?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {i.focus.slice(0, 3).map((f, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ================= COMPANIES ================= */}
          {data.companies?.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4">Companies</h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.companies.map((c) => (
                  <div
                    key={c._id}
                    className="border rounded-xl p-4 hover:shadow"
                  >
                    <h3 className="font-medium">{c.name}</h3>

                    {c.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {c.tags.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ================= GRANTS ================= */}
          {data.grants?.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Grants</h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.grants.map((g) => (
                  <div
                    key={g._id}
                    className="border rounded-xl p-4 hover:shadow"
                  >
                    <h3 className="font-medium">{g.title}</h3>

                    {g.funder && (
                      <p className="text-sm text-gray-500">
                        {g.funder}
                      </p>
                    )}

                    {g.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {g.tags.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-gray-100 px-2 py-1 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {g.link && (
                      <a
                        href={g.link}
                        target="_blank"
                        className="text-emerald-600 text-sm mt-3 inline-block"
                      >
                        Apply →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* EMPTY STATE */}
          {!loading &&
            data.investors?.length === 0 &&
            data.companies?.length === 0 &&
            data.grants?.length === 0 && (
              <p className="text-gray-500">
                No results found.
              </p>
            )}
        </>
      )}
    </div>
  );
}