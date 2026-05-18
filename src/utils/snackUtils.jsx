import { ErrorIcon, SuccessIcon } from "../components/icons/SnackIcons.jsx";

export function getVariantIcon(variant) {
  switch (variant) {
    case "success":
      return <SuccessIcon />;
    case "error":
      return <ErrorIcon />;
    default:
      return null;
  }
}
