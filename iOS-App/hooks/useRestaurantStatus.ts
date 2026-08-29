/**
 * Returns whether the restaurant is currently open.
 *
 * Currently a static flag (true = open). In a future version this could
 * be driven by operating hours in data.json or a remote config.
 */
export function useRestaurantStatus(): boolean {
  // Static: restaurant is always open in this version.
  // Replace with dynamic logic (e.g. check current time against opening hours)
  // when operating hours data becomes available.
  return true;
}

export default useRestaurantStatus;
