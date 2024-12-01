let accessToken = null;

export const setAccessToken = (token) => {
    accessToken = token;
}

export const getUserName = () => {
    return localStorage.getItem("username");
}

export const getAccessToken = () => accessToken;

export const validateInput = (input) => {
    const sanitized = input.trim();
    const maxLength = 200;
    const minLength = 2;
    if (/[^a-zA-Z0-9 _]/.test(sanitized)) {
        throw new Error("Input contains invalid characters. Only include letters, '_', spaces or numbers.");
    }
    if (sanitized.length === 0) {
        throw new Error("Input name cannot be empty.");
    }
    if (sanitized.length > maxLength) {
        throw new Error(`Input must not exceed ${maxLength} characters.`);
    }
    if (sanitized.length < minLength) {
        throw new Error(`Input must be at least ${minLength} characters.`);
    }
    return sanitized;
}

const refreshTokens = async () => {
    try {
        const response = await fetch('http://127.0.0.1:8002/api/token/refresh/', {
            method: "POST",
            credentials: 'include',
        });
        if (!response.ok) {
            throw new Error("Token refresh failed");
        }
        const data = await response.json();
        console.info("Refreshed tokens");
        setAccessToken(data.access_token);
    } catch (error) {
        console.log("Failed to refresh tokens,", error);
    }
}

window.onload = async () => {
    console.log("Page refreshed, trying to get new tokens....");
    if (!accessToken) {
        try {
            await refreshTokens();
        } catch (error) {
            console.error("Unable to refresh tokens on page load: ", error);
        }
    } else {
        console.log("Already have access token");
    }
}

/**
 * Handles API calls the server. The caller should convert to json and handle appropriately
 * @param url The URL of the API
 * @param options Any additional headers/payload can be added here
 * @returns {Promise<Response>} The response from the server
 */
export const apiCall = async (url, options = {}) => {
    if (!accessToken) {
        await refreshTokens();
    }

    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${getAccessToken()}`,
    };
    const response = await fetch(url, options);

    if (response.status === 401 || response.status === 403) {
        console.warn("Access token expired, refreshing...");
        await refreshTokens();
        options.headers.Authorization = `Bearer ${getAccessToken()}`;
        return fetch(url, options);
    }
    if (!response.ok) {
        const error = await response.json();
        console.error(`API Error: ${response.status}`, error);
        throw new Error(error.error || "API call failed");
    }
    return response;
}

