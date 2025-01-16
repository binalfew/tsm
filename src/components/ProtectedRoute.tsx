import { Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useAuth } from "uiMfe/hooks";

interface ProtectedRouteProps {
  children: JSX.Element;
  loadingText?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  loadingText = "Loading",
}) => {
  const { keycloak, initialized } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialized) {
      if (!keycloak?.authenticated) {
        keycloak
          ?.login()
          .catch((err: any) => {
            console.error("Login error:", err);
            setError("Failed to authenticate. Please try again later.");
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }
  }, [initialized, keycloak]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-medium text-red-600">{error}</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Skeleton.Button
          active={true}
          size="large"
          block={true}
          className="h-16"
          shape="square"
        />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="mt-4 font-medium text-lg text-orange-600">
              {loadingText}
              <span className="animate-pulse">...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
