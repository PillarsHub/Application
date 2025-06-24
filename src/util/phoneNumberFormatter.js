

function FormatPhoneNumber(raw) {
  // Remove all non-digit characters
  const cleaned = raw.replace(/\D/g, '');

  // If it starts with a 1 and is 11 digits, remove the 1 for formatting
  const hasCountryCode = cleaned.length === 11 && cleaned.startsWith('1');
  const digits = hasCountryCode ? cleaned.slice(1) : cleaned;

  if (digits.length !== 10) {
    return raw; // Return original if not 10 digits
  }

  const areaCode = digits.slice(0, 3);
  const central = digits.slice(3, 6);
  const line = digits.slice(6);

  const formatted = `(${areaCode}) ${central}-${line}`;
  return hasCountryCode ? `+1 ${formatted}` : formatted;
}

export default FormatPhoneNumber;