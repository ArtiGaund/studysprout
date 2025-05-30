import { Suspense } from "react";
import ResetPasswordPage from "@/components/ResetPasswordComponent";

const ResetPasswordPageWrapper = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
};

export default ResetPasswordPageWrapper;
