export const generateReferralCode = (userName) => {
  const randomNumbers = Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit number
  const userNamePart = userName.replace(/\s/g, '').slice(0, 3).toUpperCase(); // Takes the first 3 characters of the uppercase username

  // Take the last 3 characters of the random number to make it a 6-character code
  const randomCodePart = randomNumbers.toString().slice(-3);

  return `${userNamePart}${randomCodePart}`;
};