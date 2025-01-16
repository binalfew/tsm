import { useSearchParams } from "react-router-dom";
import { useAuth } from "uiMfe/hooks";
import Tsm from "../components/Tsm";

const StockRoute = () => {
  const { keycloak } = useAuth();
  const [searchParams] = useSearchParams();
  const hideSidebar = searchParams.get("mode") === "embedded";

  return <Tsm auth={keycloak} hideSidebar={hideSidebar} />;
};

export default StockRoute;
