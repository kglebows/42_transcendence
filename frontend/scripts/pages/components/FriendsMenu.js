import GlobalEventEmitter from "../../utils/EventEmitter.js";
import {BASE_FRIENDS_API_URL, EVENT_TYPES} from "../../utils/constants.js";
import {apiCall, getAccessToken, showToast, validateInput} from "../../api/api.js";
import GlobalCacheManager from "../../utils/CacheManager.js";

export class FriendsMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.users = GlobalCacheManager.get("friends") || [];
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = this.html();
        this.setupEventListeners();
    }

    html() {
        return `
            <style>
                .flex-container {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 10px;
                    width: 100%;
                }

                .container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    width: 80%;
                    margin: 10px auto;
                    text-align: center;
                    position: relative;
                }

                .guest-view {
                    display: grid;
                    align-items: center;
                    color: white;
                    height: 100%;
                    text-align: center;
                }

                button {
                    all: unset;
                }

                .container, .flex-container, .friends-list {
                    box-sizing: border-box;
                }

                .orange-button-no-absolute {
                    background: var(--background-yellow);
                    color: black;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 20px;
                }

                button {
                    all: unset;
                }

                .input-field {
                    flex: 1;
                    padding: 10px;
                    font-size: 1rem;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }

                input {
                    outline: none;
                }

                .friends-list {
                    margin-top: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    width: 100%;
                    border: 1px solid #22211F;
                    border-radius: 10px;
                    background-color: #030714;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .user-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .profile-container {
                    position: relative;
                    width: 40px;
                    height: 40px;
                }

                .profile-picture {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .status-dot {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 1px solid #fff;
                }

                .green {
                    background-color: green;
                }

                .grey {
                    background-color: darkgray;
                }

                .username {
                    font-size: 1rem;
                    color: white;
                }

                .pending {
                    font-size: 0.6rem;
                    color: gray;
                }
            </style>
            <link id="style-sheet2" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <div style="width: 100%;">
                ${getAccessToken() ? `
                    <div class="container" style="width: 90%;">
                        <div class="flex-container">
                            <input class="input-field" type="text" placeholder="Username">
                            <button id="add-btn" class="orange-button-no-absolute">ADD</button>
                        </div>
                        <button id="refresh-btn" class="orange-button-no-absolute">Refresh</button>
                        <div class="friends-list">
                            ${this.displayFriendList()}
                        </div>
                    </div>
                ` : `
                    <div class="guest-view">
                        Login first to view this page!
                    </div>
                `}
            </div>
        `;
    }

    setupEventListeners() {
        const addButton = this.shadowRoot.querySelector("#add-btn");
        if (addButton) {
            addButton.addEventListener("mouseover", () => {
                GlobalEventEmitter.emit(EVENT_TYPES.CURSOR_HOVER, { element: addButton});
            });
            addButton.addEventListener("mouseout", () => {
                GlobalEventEmitter.emit(EVENT_TYPES.CURSOR_UNHOVER, { element: addButton});
            });
            addButton.addEventListener("click", () => {
                this.addFriend();
            });
        }
        const refreshButton = this.shadowRoot.getElementById("refresh-btn");
        if (refreshButton)
            refreshButton.addEventListener('click', () => this.refreshFriendsList());

        const removeButtons = this.shadowRoot.querySelectorAll(".remove-btn");
        removeButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                const username = e.target.getAttribute("data-username");
                this.removeFriend(username);
            });
        });

        const declineButtons = this.shadowRoot.querySelectorAll(".decline-btn");
        declineButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                const username = e.target.getAttribute("data-username");
                this.declineFriend(username);
            });
        });

        const acceptButtons = this.shadowRoot.querySelectorAll(".accept-btn");
        acceptButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                const username = e.target.getAttribute("data-username");
                this.acceptFriend(username);
            });
        });
    }

    async refreshFriendsList() {
        const response = await apiCall(`${BASE_FRIENDS_API_URL}/list/`, {
            method: "GET"
        });
        if (!response.ok) {
            console.error("Failed to fetch updated friend list");
            return;
        }
        const updatedFriends = await response.json();
        GlobalCacheManager.set("friends", updatedFriends);
        this.users = updatedFriends;
        this.render();
    }

    async removeFriend(username) {
        try {
            const response = await apiCall(`${BASE_FRIENDS_API_URL}/remove/`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username }),
            });

            if (response.ok) {
                showToast("Friend successfully removed", "success");
                await this.refreshFriendsList();
            } else {
                await this.refreshFriendsList();
                showToast("Failed to remove friend", "danger");
            }
        } catch (error) {
            console.error("Error removing friend:", error);
            showToast("An error occurred while removing friend", "danger");
        }
    }

    async acceptFriend(username) {
        try {
            const response = await apiCall(`${BASE_FRIENDS_API_URL}/accept/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username }),
            });

            if (response.ok) {
                showToast(`${username} is now your friend!`, "success");
                await this.refreshFriendsList();
            } else {
                await this.refreshFriendsList();
                showToast("Failed to accept friend request", "danger");
            }
        } catch (error) {
            console.error("Error accepting friend:", error);
            showToast("An error occurred while accepting friend request", "danger");
        }
    }

    async declineFriend(username) {
        try {
            const response = await apiCall(`${BASE_FRIENDS_API_URL}/decline/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username }),
            });

            if (response.ok) {
                showToast(`Rejected ${username}`, "success");
                await this.refreshFriendsList();
            } else {
                await this.refreshFriendsList();
                showToast("Failed to decline friend request", "danger");
            }
        } catch (error) {
            console.error("Error declining friend:", error);
            showToast("An error occurred while declining friend request", "danger");
        }
    }

    async addFriend() {
        const input = this.shadowRoot.querySelector('input');
        try {
            validateInput(input.value);
            const response = await apiCall(`${BASE_FRIENDS_API_URL}/add/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    'receiver_username': input.value
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                showToast(JSON.stringify(errorData), "danger");
                throw new Error("Failed to send friend invite");
            }
            showToast('Sent friend invite', 'success');
            await this.refreshFriendsList();
        } catch (error) {
            showToast('Error when sending friend invite: ' + error, 'danger');
            console.error(error);
        }
    }

    displayFriendList() {
        if (!this.users || this.users.length === 0) {
            return `<div>Add a friend to see them here!</div>`
        }
        return this.users.map(user => `
            <div class="user-item">
                <div class="profile-container">
                    <img class="profile-picture" src="${user.profilePicture}" alt="">
                    <span class="status-dot ${user.online === "online" && user.status !== "pending" && user.status !== "waiting" ? 'green' : 'grey'}"></span>
                </div>
                <div class="username">${user.username}</div>
                ${user.status === "pending" ? `<span class="pending">(pending)</span>`: ""}
                <div class="action-buttons">
                    ${user.status === "friends" ? `
                        <button class="btn btn-danger btn-sm remove-btn" data-username="${user.username}">✖</button>
                    ` : user.status === "waiting" ? `
                        <button class="btn btn-success btn-sm accept-btn" data-username="${user.username}">✔</button>
                        <button class="btn btn-danger btn-sm decline-btn" data-username="${user.username}">✖</button>
                    ` : user.status === "pending" ? `
                        <button class="btn btn-danger btn-sm decline-btn" data-username="${user.username}">✖</button>
                    ` : ""}
                </div>
            </div>
        `).join('');
    }
}

customElements.define('friends-menu', FriendsMenu);