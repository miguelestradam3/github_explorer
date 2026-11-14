const DEFAULT_USERNAME = "miguelestradam3";
const REPOSITORIES_PER_PAGE = 100;
const CARDS_PER_PAGE = 24;

const usernameForm = document.querySelector("#username-form");
const usernameInput = document.querySelector("#username-input");
const loadButton = document.querySelector("#load-button");
const statusMessage = document.querySelector("#status-message");
const projectsGrid = document.querySelector("#projects-grid");
const searchInput = document.querySelector("#search-input");
const languageFilter = document.querySelector("#language-filter");
const sortSelect = document.querySelector("#sort-select");
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-button");
const pageIndicator = document.querySelector("#page-indicator");
const emptyState = document.querySelector("#empty-state");

const totalRepositories = document.querySelector("#total-repositories");
const totalLanguages = document.querySelector("#total-languages");
const totalStars = document.querySelector("#total-stars");
const resultsCount = document.querySelector("#results-count");

let allRepositories = [];
let currentPage = 1;
let activeUsername = DEFAULT_USERNAME;

// Load the username entered in the form.
usernameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();

    if (!username) {
        showStatus("Please enter a GitHub username.", "error");
        usernameInput.focus();
        return;
    }

    await loadRepositories(username);
});

// Every filter change returns the results to page one.
searchInput.addEventListener("input", handleFilterChange);
languageFilter.addEventListener("change", handleFilterChange);
sortSelect.addEventListener("change", handleFilterChange);

function handleFilterChange() {
    currentPage = 1;
    renderRepositories();
}

previousButton.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage -= 1;
        renderRepositories();
    }
});

nextButton.addEventListener("click", () => {
    const totalPages = getTotalPages(getFilteredRepositories().length);

    if (currentPage < totalPages) {
        currentPage += 1;
        renderRepositories();
    }
});

async function loadRepositories(username) {
    setLoading(true);
    showStatus(`Loading public repositories for ${username}...`);
    projectsGrid.innerHTML = '<div class="loading-card">Fetching repositories from GitHub...</div>';
    emptyState.classList.add("hidden");

    try {
        const repositories = await fetchAllRepositories(username);

        // Replace the current data only after the complete request succeeds.
        allRepositories = repositories;
        activeUsername = username;
        currentPage = 1;

        // Reset old filter values when switching to another GitHub account.
        searchInput.value = "";
        languageFilter.value = "";
        sortSelect.value = "updated";

        updateStatistics(allRepositories);
        populateLanguageFilter(allRepositories);
        enableFilters();
        renderRepositories();

        showStatus(
            `Successfully loaded ${allRepositories.length} public repositories for ${activeUsername}.`,
            "success"
        );
    } catch (error) {
        allRepositories = [];
        updateStatistics([]);
        projectsGrid.innerHTML = "";
        resultsCount.textContent = "0 repositories";
        pageIndicator.textContent = "Page 1 of 1";
        previousButton.disabled = true;
        nextButton.disabled = true;
        emptyState.classList.add("hidden");
        showStatus(error.message, "error");
    } finally {
        setLoading(false);
    }
}

/*
 * GitHub returns at most 100 repositories per request. Keep requesting pages
 * until a page contains fewer than 100 results so no repositories are missed.
 */
async function fetchAllRepositories(username) {
    const repositories = [];
    let page = 1;

    while (true) {
        const apiUrl = new URL(
            `https://api.github.com/users/${encodeURIComponent(username)}/repos`
        );

        apiUrl.searchParams.set("per_page", REPOSITORIES_PER_PAGE);
        apiUrl.searchParams.set("page", page);
        apiUrl.searchParams.set("sort", "pushed");
        apiUrl.searchParams.set("direction", "desc");
        apiUrl.searchParams.set("type", "owner");

        const response = await fetch(apiUrl.toString());

        if (response.status === 404) {
            throw new Error(`GitHub user "${username}" was not found.`);
        }

        if (response.status === 403 || response.status === 429) {
            throw new Error(
                "GitHub API rate limit reached. Please wait and try again later."
            );
        }

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const pageRepositories = await response.json();

        if (!Array.isArray(pageRepositories)) {
            throw new Error("GitHub returned an unexpected response.");
        }

        repositories.push(...pageRepositories);

        if (pageRepositories.length < REPOSITORIES_PER_PAGE) {
            break;
        }

        page += 1;
    }

    return repositories;
}

function updateStatistics(repositories) {
    const languages = new Set(
        repositories
            .map(repository => repository.language)
            .filter(language => typeof language === "string" && language.trim() !== "")
    );

    const stars = repositories.reduce(
        (total, repository) => total + (Number(repository.stargazers_count) || 0),
        0
    );

    totalRepositories.textContent = repositories.length;
    totalLanguages.textContent = languages.size;
    totalStars.textContent = stars;
}

function populateLanguageFilter(repositories) {
    const previousLanguage = languageFilter.value;
    const languages = [...new Set(
        repositories
            .map(repository => repository.language)
            .filter(language => typeof language === "string" && language.trim() !== "")
    )].sort((first, second) => first.localeCompare(second));

    languageFilter.replaceChildren();

    const allLanguagesOption = document.createElement("option");
    allLanguagesOption.value = "";
    allLanguagesOption.textContent = "All languages";
    languageFilter.appendChild(allLanguagesOption);

    languages.forEach(language => {
        const option = document.createElement("option");
        option.value = language;
        option.textContent = language;
        languageFilter.appendChild(option);
    });

    // Keep the selected language if it exists for the newly loaded account.
    languageFilter.value = languages.includes(previousLanguage) ? previousLanguage : "";
}

function getFilteredRepositories() {
    const searchTerm = searchInput.value.trim().toLocaleLowerCase();
    const selectedLanguage = languageFilter.value;
    const sortMethod = sortSelect.value;

    const filteredRepositories = allRepositories.filter(repository => {
        const topics = Array.isArray(repository.topics) ? repository.topics : [];
        const searchableFields = [
            repository.name,
            repository.full_name,
            repository.description,
            repository.language,
            ...topics
        ];

        const searchableText = searchableFields
            .filter(value => value !== null && value !== undefined)
            .join(" ")
            .toLocaleLowerCase();

        const matchesSearch = searchableText.includes(searchTerm);
        
        // Robust case-insensitive and trimmed language match
        const matchesLanguage = !selectedLanguage || 
            (repository.language && repository.language.trim().toLowerCase() === selectedLanguage.trim().toLowerCase());

        return matchesSearch && matchesLanguage;
    });

    // Sort a new filtered array, leaving the original API data untouched.
    filteredRepositories.sort((first, second) => {
        if (sortMethod === "created") {
            return getTimestamp(second.created_at) - getTimestamp(first.created_at);
        }

        if (sortMethod === "stars") {
            return (Number(second.stargazers_count) || 0)
                - (Number(first.stargazers_count) || 0);
        }

        if (sortMethod === "name") {
            return (first.name || "").localeCompare(second.name || "");
        }

        return getTimestamp(second.pushed_at || second.updated_at)
            - getTimestamp(first.pushed_at || first.updated_at);
    });

    return filteredRepositories;
}

function getTimestamp(dateValue) {
    const timestamp = new Date(dateValue || 0).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTotalPages(repositoryCount) {
    return Math.max(1, Math.ceil(repositoryCount / CARDS_PER_PAGE));
}

function renderRepositories() {
    const filteredRepositories = getFilteredRepositories();
    const totalPages = getTotalPages(filteredRepositories.length);

    // Keep the current page valid after a filter reduces the result count.
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const visibleRepositories = filteredRepositories.slice(
        startIndex,
        startIndex + CARDS_PER_PAGE
    );

    projectsGrid.replaceChildren();
    resultsCount.textContent =
        `${filteredRepositories.length} ${filteredRepositories.length === 1 ? "repository" : "repositories"}`;

    if (visibleRepositories.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
        visibleRepositories.forEach(repository => {
            projectsGrid.appendChild(createRepositoryCard(repository));
        });
    }

    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    previousButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
}

function createRepositoryCard(repository) {
    const card = document.createElement("article");
    card.className = "project-card";

    const cardTop = document.createElement("div");
    cardTop.className = "card-top";

    const projectIcon = document.createElement("span");
    projectIcon.className = "project-icon";
    projectIcon.textContent = "⌘";
    projectIcon.setAttribute("aria-hidden", "true");

    const visibility = document.createElement("span");
    visibility.className = "visibility";
    visibility.textContent = repository.private ? "Private" : "Public";
    cardTop.append(projectIcon, visibility);

    const title = document.createElement("h3");
    const repositoryLink = document.createElement("a");
    repositoryLink.href = repository.html_url;
    repositoryLink.target = "_blank";
    repositoryLink.rel = "noopener noreferrer";
    repositoryLink.textContent = repository.name;
    title.appendChild(repositoryLink);

    const description = document.createElement("p");
    description.className = "project-description";
    description.textContent = repository.description || "No description provided for this repository.";

    const footer = document.createElement("div");
    footer.className = "card-footer";

    if (repository.language) {
        const language = document.createElement("span");
        language.className = "card-meta";
        const languageDot = document.createElement("span");
        languageDot.className = "language-dot";
        languageDot.setAttribute("aria-hidden", "true");
        language.append(languageDot, document.createTextNode(repository.language));
        footer.appendChild(language);
    }

    const stars = document.createElement("span");
    stars.className = "card-meta";
    stars.textContent = `★ ${Number(repository.stargazers_count) || 0}`;
    footer.appendChild(stars);

    const forks = document.createElement("span");
    forks.className = "card-meta";
    forks.textContent = `⑂ ${Number(repository.forks_count) || 0}`;
    footer.appendChild(forks);

    if (repository.fork) {
        const forkLabel = document.createElement("span");
        forkLabel.className = "card-meta";
        forkLabel.textContent = "Fork";
        footer.appendChild(forkLabel);
    }

    card.append(cardTop, title, description, footer);
    return card;
}

function enableFilters() {
    searchInput.disabled = false;
    languageFilter.disabled = false;
    sortSelect.disabled = false;
}

function setLoading(isLoading) {
    loadButton.disabled = isLoading;
    loadButton.textContent = isLoading ? "Loading..." : "Load repositories";
}

function showStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`.trim();
}

// Automatically load the profile when the page opens.
loadRepositories(DEFAULT_USERNAME);