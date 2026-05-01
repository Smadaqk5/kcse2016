import Link from "next/link";
import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <section className="max-w-md mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">Student Registration</h1>
      <RegisterForm />
      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-emerald-700 font-medium underline">
          Login
        </Link>
      </p>
    </section>
  );
}
