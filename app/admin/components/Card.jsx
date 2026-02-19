export default function Card({ title, value, growth }) {
  const positive = growth?.includes("+");

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="text-2xl font-semibold mt-1">
        {value}
      </h2>

      {growth && (
        <p
          className={`text-sm mt-2 ${
            positive ? "text-green-600" : "text-red-500"
          }`}
        >
          {growth}
        </p>
      )}
    </div>
  );
}
