import axios from "axios";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
    if (error.response && error.response.status === 400) {
      // Token expired, log the user out
      logoutUser().then(() => {
        window.location.reload(); // Reload the page to reflect the logout
      });
    }
    return Promise.reject(error);
  }
);

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

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token = await userCredential.user.getIdToken();

    return axios
      .post(
        `${BASE_URL}/login`,
        { token },
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

export const logoutUser = () => {
  return axios
    .post(`${BASE_URL}/logout`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    .then((response) => {
      console.log(response.data.message);
    })
    .catch((error) => {
      console.error("Error logging out:", error);
      throw error;
    });
};

export const getPin = () => {
  console.log("getPin");

  return axios
    .get(`${BASE_URL}/api/pin`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("Successfully retrieved pin");
      console.log("response", response);
      return response.data.pin;
    })
    .catch((error) => {
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
