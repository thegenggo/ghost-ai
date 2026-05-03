import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/**
 * Performs a server-side redirect to the appropriate page based on the current user's authentication state.
 *
 * Redirects to "/editor" when the user is authenticated, otherwise redirects to "/sign-in".
 */
export default async function Home() {
  const { isAuthenticated } = await auth();
  redirect(isAuthenticated ? "/editor" : "/sign-in");
}
