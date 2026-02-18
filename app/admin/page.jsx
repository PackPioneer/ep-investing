import { currentUser } from "@clerk/nextjs/server";

export default async function AdminPage() {
  const user = await currentUser();

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">
        Welcome {user?.firstName}
      </h1>
    </div>
  );
}
