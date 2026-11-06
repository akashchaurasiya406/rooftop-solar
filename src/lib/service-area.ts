const REGIONS: Record<string, string> = {
  "440": "Nagpur",
  "441": "Nagpur rural, Bhandara, Gondia",
  "442": "Wardha, Chandrapur, Gadchiroli",
  "443": "Buldhana",
  "444": "Akola, Amravati, Washim",
  "445": "Yavatmal",
};

export function regionForPincode(pincode: string): string | null {
  if (!/^\d{6}$/.test(pincode)) return null;
  return REGIONS[pincode.slice(0, 3)] ?? null;
}

export const inServiceArea = (pincode: string) => regionForPincode(pincode) !== null;
