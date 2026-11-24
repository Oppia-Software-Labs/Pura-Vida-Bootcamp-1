import { useEffect, useState } from "react";

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function useNow(): number {
  const [now, setNow] = useState(nowSeconds);

  useEffect(() => {
    const id = setInterval(() => setNow(nowSeconds()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
