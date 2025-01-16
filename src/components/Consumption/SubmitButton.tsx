import { Button, Modal, Tooltip } from "antd";

import { useQueryClient } from "@tanstack/react-query";
import { RoleEnforcer } from "common-react-components";
import Keycloak from "keycloak-js";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRoles, useToken } from "../../hooks";
import { useSubmitBasket } from "../../mutations/basket";
import { useTsmStore } from "../../stores/tsmStore";
type SubmitButtonProps = {
  disabled: boolean;
  basket: Basket | undefined;
  auth: Keycloak;
};

const SubmitButton: React.FC<SubmitButtonProps> = ({
  disabled,
  basket,
  auth,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    resetConsumption,
    setConsumptionSearchParams,
    setIsBusy,
    consumption,
  } = useTsmStore((state) => state);
  const token = useToken(auth);
  const { mutate: submitBasket } = useSubmitBasket(token);
  const roles = useRoles(auth, "technician-stock-management-fe");
  const [modal, contextHolder] = Modal.useModal();
  const [searchParams] = useSearchParams();

  const handleSubmitSuccess = () => {
    queryClient.invalidateQueries();
    setIsBusy(false);
    if (searchParams.get("mode") === "popup") {
      window.close();
    }
  };

  const handleSubmitError = (error: Error) => {
    setIsBusy(false);
    modal.error({
      title: "Error Submitting Basket",
      content:
        error.message ||
        "An unexpected error occurred while submitting the basket.",
      onOk: () => {
        queryClient.invalidateQueries();
      },
    });
  };

  const handleSubmitBasket = (id: number) => {
    const message = consumption.noStockUsed
      ? "No stock used in this basket. Are you sure you want to submit it?"
      : "Are you sure you want to submit this basket?";

    modal.confirm({
      title: message,
      onOk: () => {
        if (consumption.noStockUsed && searchParams.get("mode") === "popup") {
          modal.success({
            title: "Submission Successful",
            content: "The basket has been submitted successfully.",
            onOk: () => window.close(),
          });
          return;
        }

        if (id === 0) {
          resetConsumption();
          setConsumptionSearchParams({
            ticketType: "",
            ticketIdentifier: "",
          });
          navigate("/consumption");
          return;
        }

        const submission: SubmitBasketModel = { id };
        setIsBusy(true);
        submitBasket(submission, {
          onSuccess: handleSubmitSuccess,
          onError: handleSubmitError,
        });
      },
    });
  };

  if (!basket && !consumption.noStockUsed) {
    return null;
  }

  if (basket && basket.basketItems.length === 0 && !consumption.noStockUsed) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <RoleEnforcer
        roles={roles}
        permittedRoles={["TSM_ADD_STOCK_TECH", "TSM_ADD_STOCK_SUPER"]}
        matchAll={false}
        deniedRender={<div>Access Denied</div>}
        deniedProps={{ disabled: true }}
        deniedPropsPassingType="Shallow"
        deniedShowPermittedRoles={true}
      >
        <Tooltip title="Submit basket">
          <Button
            type="primary"
            onClick={() => handleSubmitBasket(basket?.id || 0)}
            disabled={disabled}
            className="mr-2"
          >
            Submit
          </Button>
        </Tooltip>
      </RoleEnforcer>
    </>
  );
};

export default SubmitButton;
