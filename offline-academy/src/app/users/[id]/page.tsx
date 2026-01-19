interface Props {
  params: { id: string };
}

export default function UserProfile({ params }: Props) {
  const { id } = params;

  return (
    <main className="flex flex-col items-center mt-10">
      <h2 className="text-xl font-bold">User Profile</h2>
      <p>ID: {id}</p>
      <p>Name: User {id}</p>
    </main>
  );
}
