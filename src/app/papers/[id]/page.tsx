import { redirect } from "next/navigation";

export default async function PaperRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/papers/${id}/view`);
}
