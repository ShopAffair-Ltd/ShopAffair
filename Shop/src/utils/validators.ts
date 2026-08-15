export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateBvn(bvn: string): boolean {
  // BVN must be exactly 11 digits in Nigeria
  return /^\d{11}$/.test(bvn);
}

export function validateAccountNumber(accountNumber: string): boolean {
  // NUBAN account numbers must be exactly 10 digits
  return /^\d{10}$/.test(accountNumber);
}

export function validatePhoneNumber(phone: string): boolean {
  // Standard Nigerian format (+234 or 070, 080, 090, 081 etc.)
  return /^(?:\+234|0)[789]\d{9}$/.test(phone.replace(/\s+/g, ''));
}
