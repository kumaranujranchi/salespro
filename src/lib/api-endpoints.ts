// Universal API endpoint proxy for RealSalePro (AWS Lightsail Node.js + PostgreSQL)
// Replaces deprecated Convex generated references seamlessly

const createProxy = (path = ''): any => {
  return new Proxy(() => path, {
    get: (_target, prop) => {
      if (typeof prop === 'symbol') {
        if (prop === Symbol.toPrimitive) {
          return () => path;
        }
        if (prop === Symbol.toStringTag) {
          return 'ApiProxy';
        }
        return undefined;
      }
      if (prop === 'toString' || prop === 'valueOf') {
        return () => path;
      }
      if (prop === '_name') {
        return path;
      }
      return createProxy(path ? `${path}.${prop}` : prop);
    },
    apply: () => path,
  });
};

export const api: any = createProxy();
export const internal: any = createProxy();
export const components: any = createProxy('components');

// Universal string ID type compatible with PostgreSQL UUIDs and string IDs
export type Id<T = string> = string;
export type Doc<T = string> = any;
export type TableNames = string;
