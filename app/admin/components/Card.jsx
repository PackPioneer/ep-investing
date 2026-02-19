export default function Card({ title, value }) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500 mb-2">
        {title}
      </p>

      <h2 className="text-3xl font-semibold">
        {value}
      </h2>
    </div>
  );
}
