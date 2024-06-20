import axios from "axios";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onIdTokenChanged,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API,
  authDomain: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
};

const BASE_URL = process.env.REACT_APP_BACKEND_URL;
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Ensure cookies are included in requests
axios.defaults.withCredentials = true;

// Global token expiration interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      // Token expired, log the user out
      logoutUser();
      // .then(() => {
      //   window.location.reload(); // Reload the page to reflect the logout
      // });
    }
    return Promise.reject(error);
  }
);

let unsubscribeOnIdTokenChanged;
let refreshTokenTimeoutId;

const refreshToken = async () => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(true); // Force refresh the token
    const expirationTime = localStorage.getItem("expirationTime");

    // Calculate the remaining time for the session
    const now = new Date().getTime();
    const remainingTime = expirationTime - now;

    // If the session has expired, log the user out
    if (remainingTime <= 0) {
      // Clear local storage and cookies
      localStorage.removeItem("stayLoggedIn");
      localStorage.removeItem("expirationTime");
      await axios.post(`${BASE_URL}/logout`);
      // Optionally, you can redirect the user to the login page or show a message
      return;
    }

    await axios.post(
      `${BASE_URL}/refresh-token`,
      { token, expirationTime },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const initializeAppTokenRefresh = () => {
  console.log("Initializing app token refresh");

  // Ensure the listener is set up only once
  if (!unsubscribeOnIdTokenChanged) {
    console.log("Setting up ID token change listener");
    unsubscribeOnIdTokenChanged = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();

        // Parse the expiration time string into a Date object
        const expirationDate = new Date(idTokenResult.expirationTime);

        // Calculate the time remaining in milliseconds
        const expiresIn = expirationDate.getTime() - Date.now();

        // Clear the existing timeout if it exists
        if (refreshTokenTimeoutId) {
          clearTimeout(refreshTokenTimeoutId);
        }

        // Refresh token 5 minutes before it expires
        refreshTokenTimeoutId = setTimeout(
          refreshToken,
          expiresIn - 5 * 60 * 1000
        );
      }
    });
  }

  // Immediate token refresh on app start if user is already logged in
  if (auth.currentUser) {
    refreshToken();
  }
};

export const checkAuthStatus = () => {
  return axios
    .get(`${BASE_URL}/auth-status`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      return response.data.isAuthenticated;
    })
    .catch((error) => {
      console.error("Error checking authentication status:", error);
      return false;
    });
};

export const registerUser = (data) => {
  console.log("registerUser");

  // Initialize settings for the new user
  const settings = {
    clockin: {
      roundTime: 5, // default value of 5 minutes
      timeBetween: 60, // default value of 60 minutes
    },
  };

  // Include the settings in the data sent to the server
  const userData = { ...data, settings };

  return axios
    .post(`${BASE_URL}/register`, { data: userData })
    .then((response) => {
      console.log("Successfully registered user");
      return response.data;
    })
    .catch((error) => {
      console.error("Error registering user:", error);
      throw error;
    });
};

export const loginUser = async (email, password, stayLoggedIn) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const token = await userCredential.user.getIdToken();

    // Calculate the initial expiration time
    const now = new Date();
    const expirationTime = stayLoggedIn
      ? now.getTime() + 7 * 24 * 60 * 60 * 1000
      : now.getTime() + 1 * 24 * 60 * 60 * 1000; // 7 days or 1 day

    // Save the stayLoggedIn preference and expiration time in local storage
    localStorage.setItem("stayLoggedIn", stayLoggedIn);
    localStorage.setItem("expirationTime", expirationTime);

    return axios
      .post(
        `${BASE_URL}/login`,
        { token, stayLoggedIn, expirationTime },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("Successfully logged in user");
        return response.data;
      })
      .catch((error) => {
        console.error("Error logging in user:", error);
        throw error;
      });
  } catch (error) {
    console.error("Error logging in user:", error.code);
    let errorMessage;
    switch (error.code) {
      case "auth/invalid-credential":
        errorMessage = "No user found with the provided email or password.";
        break;
      case "auth/wrong-password":
        errorMessage =
          "The provided value for the password user property is invalid. It must be a string with at least six characters.";
        break;
      case "auth/invalid-email":
        errorMessage =
          "The provided value for the email user property is invalid. It must be a string email address.";
        break;
      case "auth/too-many-requests":
        errorMessage = "The number of requests exceeds the maximum allowed.";
        break;
      default:
        errorMessage =
          "The Authentication server encountered an unexpected error while trying to process the request.";
        break;
    }
    throw new Error(errorMessage);
  }
};

export const logoutUser = async () => {
  try {
    // Unsubscribe the onIdTokenChanged listener
    if (unsubscribeOnIdTokenChanged) {
      unsubscribeOnIdTokenChanged();
      unsubscribeOnIdTokenChanged = null;
    }

    // Perform the sign-out operation using Firebase's signOut method
    await signOut(auth);

    // Clear local storage items related to authentication
    localStorage.removeItem("stayLoggedIn");
    localStorage.removeItem("expirationTime");

    // Notify the backend about the logout
    const response = await axios.post(`${BASE_URL}/logout`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(response.data.message);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const checkPin = (pincode) => {
  console.log("checkPin");

  return axios
    .get(`${BASE_URL}/check-pin`, {
      params: { pincode },
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      if (error.response && error.response.status === 403) {
      }
      console.error("Error retrieving pin:", error);
      throw error;
    });
};
export const getEmployees = () => {
  return axios
    .get(`${BASE_URL}/get-employees`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    })
    .then((response) => {
      return response.data.employees;
    })
    .catch((error) => {
      console.error("Error retrieving employees:", error);
      throw error;
    });
};

export const createEmployee = (employee) => {
  console.log("createEmployee");

  return axios
    .post(
      `${BASE_URL}/create-employee`,
      { employee }, // send the employee data as an object
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    )

    .then((response) => {
      console.log("Successfully created employee");
      console.log("response.data", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error creating employee:", error);
      throw error;
    });
};

export const editEmployees = (employees) => {
  console.log("editEmployees");

  return axios
    .post(
      `${BASE_URL}/edit-employees`,
      { employees },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error("Error editing employees:", error);
      throw error;
    });
};

export const setTime = (employeeId, date) => {
  console.log("setTime");

  return axios
    .post(
      `${BASE_URL}/set-time`,
      { employeeId, date },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      const data = response.data;
      return data;
    })
    .catch((error) => {
      console.error("Error setting time:", error);
      throw error;
    });
};

export const editHours = (date, hours) => {
  console.log("editHours");

  return axios
    .post(
      `${BASE_URL}/edit-hours`,
      { date, hours },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error("Error editing hours:", error);
      throw error;
    });
};

export const getHours = (date) => {
  return axios
    .get(`${BASE_URL}/get-hours`, {
      params: { date: date },
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    })
    .then((response) => {
      const hoursData = response.data.hoursData;

      return hoursData;
    })
    .catch((error) => {
      console.error("Error retrieving hours:", error);
      throw error;
    });
};

export const getSettings = () => {
  return axios
    .get(`${BASE_URL}/get-settings`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    })
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error("Error retrieving settings:", error);
      throw error;
    });
};

export const editSettings = (settings) => {
  return axios
    .post(
      `${BASE_URL}/edit-settings`,
      { settings },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error("Error editing settings:", error);
      throw error;
    });
};
