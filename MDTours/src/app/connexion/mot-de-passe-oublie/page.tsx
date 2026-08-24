import Header from "@/components/Header";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header variant="solid" />
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-16">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
