import { useSelector } from "react-redux";
import { RootState } from "../../store";

const CertificateIssuedGuard = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isCertificateIssued = useSelector(
    (state: RootState) => state.society.isCertificateIssued
  );

  if (!isCertificateIssued) return null;

  return <>{children}</>;
};

export default CertificateIssuedGuard;