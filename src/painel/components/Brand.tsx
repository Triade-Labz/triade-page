import { LogoMark, Wordmark } from "../../shared/components/LogoMark";
import { useApp } from "../appContext";

export function Brand() {
  const app = useApp();
  return (
    <div className="brand">
      <LogoMark />
      <Wordmark className="wm" />
      <span className="tag">{app}</span>
    </div>
  );
}
