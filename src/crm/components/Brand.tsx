import { LogoMark, Wordmark } from "../../shared/components/LogoMark";

export function Brand() {
  return (
    <div className="brand">
      <LogoMark />
      <Wordmark />
      <span className="crm">crm</span>
    </div>
  );
}
