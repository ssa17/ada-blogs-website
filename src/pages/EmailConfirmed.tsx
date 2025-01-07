import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const type = queryParams.get("type");

    if (type !== "signup") {
      navigate("/"); // Redirect if the type is not "signup"
    }
  }, [location, navigate]);

  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-green-600">Email Confirmed!</h1>
          <p className="mt-4 text-gray-700">
            Your email has been successfully confirmed. You can now proceed to log in or explore your account.
          </p>
          <div className="mt-6">
            <Button
                className="w-full"
                onClick={() => navigate("/signin")}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
  );
}
