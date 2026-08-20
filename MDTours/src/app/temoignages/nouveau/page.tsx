import { Suspense } from "react";
import TestimonyForm from "@/components/TestimonyForm";

export default function NewTestimonialPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-gray-500">Chargement...</p>}>
      <TestimonyForm />
    </Suspense>
  );
}
