import { SignIn } from "@clerk/nextjs";

/**
 * Render the Clerk `SignIn` component as the default sign-in page.
 *
 * @returns A React element that renders the Clerk `SignIn` UI
 */
export default function SignInPage() {
  return <SignIn />;
}
