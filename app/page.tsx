import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { isAuthenticated } = await auth();
  redirect(isAuthenticated ? "/editor" : "/sign-in");
}
