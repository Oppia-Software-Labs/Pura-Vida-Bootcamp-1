import type { Level } from "@/lib/journey";
import { Icon } from "./Icon";

export function LevelArt({ level }: { level: Level }) {
  return (
    <div aria-hidden="true" className={`stage-art stage-art-${level}`}>
      {level === 2 && <><Icon name="egg"/><Icon name="egg"/><Icon name="egg"/></>}
      {level === 3 && <><Icon name="steps"/><Icon name="steps"/><Icon name="steps"/></>}
      {level === 4 && <><Icon name="waves"/><Icon name="waves"/></>}
    </div>
  );
}
