// Mock implementation of p-limit
export default function pLimit() {
  return async (fn: Function) => fn();
}
