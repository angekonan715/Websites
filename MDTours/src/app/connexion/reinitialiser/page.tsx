import { Suspense } from "react";
import Header from "@/components/Header";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-16">
        <Suspense
          fallback={
            <div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-white" />
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
