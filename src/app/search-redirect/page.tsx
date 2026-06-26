import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ ticker?: string }>;
}

export default async function SearchRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ticker = params.ticker?.trim().toUpperCase() || "";
  
  if (ticker) {
    redirect(`/research/${ticker}`);
  } else {
    redirect("/");
  }
}
