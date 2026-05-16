import { LoginForm } from "@/components/forms/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="max-w-md mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Login</h1>
      <p className="text-sm text-slate-600 mb-4">
        Students and administrators sign in here. Admin accounts open the admin dashboard after sign-in.
      </p>
      <LoginForm />
      <p className="text-sm text-slate-600">
        New student?{" "}
        <Link href="/register" className="text-emerald-700 font-medium underline">
          Create account
        </Link>
      </p>
    </section>
  );
}
