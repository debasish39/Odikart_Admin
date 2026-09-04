const TOKEN_KEY =
  "odikart_admin_token";

const USER_KEY =
  "odikart_admin_user";

// Save admin authentication
export const saveAdminAuth = (
  token,
  user
) => {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );

  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user)
  );
};

// Get token
export const getAdminToken = () => {
  return localStorage.getItem(
    TOKEN_KEY
  );
};

// Get user
export const getAdminUser = () => {
  try {
    const user =
      localStorage.getItem(USER_KEY);

    return user
      ? JSON.parse(user)
      : null;
  } catch (error) {
    console.error(
      "Failed to parse admin user:",
      error
    );

    return null;
  }
};

// Clear authentication
export const clearAdminAuth = () => {
  localStorage.removeItem(
    TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
};