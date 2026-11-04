import type { Metadata } from "next";
import { SignupForm } from "../auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1.5 mb-7 text-[15px] text-muted">
        Check if solar suits your home and follow your installation.
      </p>
      <SignupForm />
    </>
  );
}
