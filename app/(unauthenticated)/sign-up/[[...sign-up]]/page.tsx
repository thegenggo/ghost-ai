import { SignUp } from "@clerk/nextjs";

/**
 * Render the Clerk SignUp UI for unauthenticated users.
 *
 * @returns A React element that renders Clerk's `SignUp` component.
 */
export default function SignUpPage() {
  return <SignUp />;
}
