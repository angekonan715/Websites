import { Suspense } from "react";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";

export default function ConnexionPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-16">
        <Suspense fallback={<div className="h-80 w-full max-w-md animate-pulse rounded-2xl bg-white" />}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
