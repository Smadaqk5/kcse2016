import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}
