import { currentUser } from "@clerk/nextjs/server";

export default async function AdminPage() {
  const user = await currentUser();

  return (
    <section className="h-screen">
      <div className="flex items-start justify-start mx-auto max-w-7xl pt-32 px-5">
      <h1 className="text-3xl font-bold">
        Welcome {user?.firstName}
      </h1>
    </div>
    </section>
  );
}
