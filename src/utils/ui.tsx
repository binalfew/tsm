import { RoleEnforcer } from "common-react-components";

export const renderWithRoleEnforcer = (
  roles: string[],
  permittedRoles: string[],
  content: JSX.Element,
  deniedContent: JSX.Element = <div>Access Denied</div>,
  additionalProps: any = {}
) => (
  <RoleEnforcer
    roles={roles}
    permittedRoles={permittedRoles}
    matchAll={false}
    deniedRender={deniedContent}
    deniedProps={{ disabled: true }}
    deniedPropsPassingType="Shallow"
    deniedShowPermittedRoles={true}
    {...additionalProps}
  >
    {content}
  </RoleEnforcer>
);

export const withRoleEnforcer = (
  WrappedComponent: React.ComponentType<any>,
  enforcerProps: any
) => {
  return (props: any) => (
    <RoleEnforcer {...enforcerProps}>
      <WrappedComponent {...props} />
    </RoleEnforcer>
  );
};
