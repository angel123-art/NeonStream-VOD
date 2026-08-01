type StopFn = () => void;

const registry = new Set<StopFn>();

export function registerCardTrailer(stop: StopFn): () => void {
  registry.add(stop);
  return () => registry.delete(stop);
}

export function stopAllCardTrailers(except?: StopFn): void {
  registry.forEach((stop) => {
    if (stop !== except) stop();
  });
}
