import { AdminLoginForm } from "@/components/forms/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50">
      <div className="w-full max-w-md">
        <AdminLoginForm />
      </div>
    </div>
  );
}
