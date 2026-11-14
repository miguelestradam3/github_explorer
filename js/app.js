const DEFAULT_USERNAME = "miguelestradam3";
const REPOSITORIES_PER_PAGE = 100;
const CARDS_PER_PAGE = 24;

const translations = {
    en: {
        pageTitle: "GitHub Project Explorer",
        brandHome: "GitHub Project Explorer home",
        brandName: "Project Explorer",
        languageLabel: "Select language",
        viewProfile: "View GitHub Profile",
        eyebrow: "PUBLIC REPOSITORY DIRECTORY",
        heroTitle: 'Explore my <span>GitHub projects.</span>',
        heroDescription: "A live collection of public repositories, fetched directly from the GitHub API.",
        usernameLabel: "GitHub username",
        usernamePlaceholder: "Enter a GitHub username",
        loadRepositories: "Load repositories",
        loadingButton: "Loading...",
        initialLoading: "Loading repositories...",
        statsLabel: "Repository statistics",
        repositories: "Repositories",
        languages: "Languages",
        totalStars: "Total stars",
        collectionEyebrow: "THE COLLECTION",
        repositoriesHeading: "Repositories",
        searchLabel: "Search repositories",
        searchPlaceholder: "Search by project name or description...",
        languageFilterLabel: "Filter by language",
        allLanguages: "All languages",
        sortLabel: "Sort repositories",
        sortUpdated: "Recently updated",
        sortCreated: "Recently created",
        sortStars: "Most stars",
        sortName: "Name (A–Z)",
        fetchingRepositories: "Fetching repositories from GitHub...",
        noRepositories: "No repositories found",
        tryAnotherSearch: "Try another search term or language filter.",
        previous: "← Previous",
        next: "Next →",
        footerText: "Built with HTML, CSS, JavaScript, and the GitHub REST API.",
        apiDocumentation: "GitHub API documentation ↗",
        enterUsername: "Please enter a GitHub username.",
        loadingUser: "Loading public repositories for {username}...",
        loadedUser: "Successfully loaded {count} public repositories for {username}.",
        userNotFound: 'GitHub user "{username}" was not found.',
        rateLimit: "GitHub API rate limit reached. Please wait and try again later.",
        apiError: "GitHub API error: {status} {statusText}",
        unexpectedResponse: "GitHub returned an unexpected response.",
        repository: "repository",
        repositoryPlural: "repositories",
        results: "{count} {label}",
        page: "Page {current} of {total}",
        public: "Public",
        private: "Private",
        noDescription: "No description provided for this repository.",
        fork: "Fork"
    },
    es: {
        pageTitle: "Explorador de Proyectos de GitHub",
        brandHome: "Inicio del Explorador de Proyectos de GitHub",
        brandName: "Explorador de Proyectos",
        languageLabel: "Seleccionar idioma",
        viewProfile: "Ver perfil de GitHub",
        eyebrow: "DIRECTORIO DE REPOSITORIOS PÚBLICOS",
        heroTitle: 'Explora mis <span>proyectos de GitHub.</span>',
        heroDescription: "Una colección actualizada de repositorios públicos, obtenida directamente desde la API de GitHub.",
        usernameLabel: "Usuario de GitHub",
        usernamePlaceholder: "Ingresa un nombre de usuario de GitHub",
        loadRepositories: "Cargar repositorios",
        loadingButton: "Cargando...",
        initialLoading: "Cargando repositorios...",
        statsLabel: "Estadísticas de repositorios",
        repositories: "Repositorios",
        languages: "Lenguajes",
        totalStars: "Estrellas totales",
        collectionEyebrow: "LA COLECCIÓN",
        repositoriesHeading: "Repositorios",
        searchLabel: "Buscar repositorios",
        searchPlaceholder: "Buscar por nombre o descripción del proyecto...",
        languageFilterLabel: "Filtrar por lenguaje",
        allLanguages: "Todos los lenguajes",
        sortLabel: "Ordenar repositorios",
        sortUpdated: "Actualizados recientemente",
        sortCreated: "Creados recientemente",
        sortStars: "Más estrellas",
        sortName: "Nombre (A–Z)",
        fetchingRepositories: "Obteniendo repositorios desde GitHub...",
        noRepositories: "No se encontraron repositorios",
        tryAnotherSearch: "Prueba con otro término de búsqueda o filtro de lenguaje.",
        previous: "← Anterior",
        next: "Siguiente →",
        footerText: "Desarrollado con HTML, CSS, JavaScript y la API REST de GitHub.",
        apiDocumentation: "Documentación de la API de GitHub ↗",
        enterUsername: "Por favor, ingresa un nombre de usuario de GitHub.",
        loadingUser: "Cargando repositorios públicos de {username}...",
        loadedUser: "Se cargaron correctamente {count} repositorios públicos de {username}.",
        userNotFound: 'No se encontró el usuario de GitHub "{username}".',
        rateLimit: "Se alcanzó el límite de solicitudes de la API de GitHub. Espera e inténtalo de nuevo.",
        apiError: "Error de la API de GitHub: {status} {statusText}",
        unexpectedResponse: "GitHub devolvió una respuesta inesperada.",
        repository: "repositorio",
        repositoryPlural: "repositorios",
        results: "{count} {label}",
        page: "Página {current} de {total}",
        public: "Público",
        private: "Privado",
        noDescription: "No se proporcionó una descripción para este repositorio.",
        fork: "Derivado"
    }
};

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
const languageSelector = document.querySelector("#language-selector");

const totalRepositories = document.querySelector("#total-repositories");
const totalLanguages = document.querySelector("#total-languages");
const totalStars = document.querySelector("#total-stars");
const resultsCount = document.querySelector("#results-count");

let allRepositories = [];
let currentPage = 1;
let activeUsername = DEFAULT_USERNAME;
let currentLanguage = localStorage.getItem("githubExplorerLanguage") || "en";
let lastStatus = { key: "initialLoading", params: {}, type: "" };

if (!translations[currentLanguage]) {
    currentLanguage = "en";
}

function translate(key, params = {}) {
    let text = translations[currentLanguage][key] || translations.en[key] || key;

    Object.entries(params).forEach(([name, value]) => {
        text = text.replaceAll(`{${name}}`, String(value));
    });

    return text;
}

function applyTranslations() {
    document.documentElement.lang = currentLanguage;
    document.title = translate("pageTitle");
    languageSelector.value = currentLanguage;

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;

        // The hero title intentionally contains a highlighted span.
        if (key === "heroTitle") {
            element.innerHTML = translate(key);
        } else {
            element.textContent = translate(key);
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
        element.placeholder = translate(element.dataset.i18nPlaceholder);
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(element => {
        element.setAttribute("aria-label", translate(element.dataset.i18nAria));
    });

    showStatus(lastStatus.key, lastStatus.type, lastStatus.params);
    setLoading(loadButton.disabled);

    if (allRepositories.length > 0) {
        populateLanguageFilter(allRepositories);
        renderRepositories();
    } else {
        resultsCount.textContent = translate("results", {
            count: 0,
            label: translate("repositoryPlural")
        });
    }
}

languageSelector.addEventListener("change", () => {
    currentLanguage = languageSelector.value;
    localStorage.setItem("githubExplorerLanguage", currentLanguage);
    applyTranslations();
});

usernameForm.addEventListener("submit", async event => {
    event.preventDefault();
    const username = usernameInput.value.trim();

    if (!username) {
        showStatus("enterUsername", "error");
        usernameInput.focus();
        return;
    }

    await loadRepositories(username);
});

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
    showStatus("loadingUser", "", { username });
    projectsGrid.innerHTML = `<div class="loading-card">${translate("fetchingRepositories")}</div>`;
    emptyState.classList.add("hidden");

    try {
        const repositories = await fetchAllRepositories(username);

        allRepositories = repositories;
        activeUsername = username;
        currentPage = 1;
        searchInput.value = "";
        languageFilter.value = "";
        sortSelect.value = "updated";

        updateStatistics(allRepositories);
        populateLanguageFilter(allRepositories);
        enableFilters();
        renderRepositories();

        showStatus("loadedUser", "success", {
            count: allRepositories.length,
            username: activeUsername
        });
    } catch (error) {
        allRepositories = [];
        updateStatistics([]);
        projectsGrid.replaceChildren();
        resultsCount.textContent = translate("results", {
            count: 0,
            label: translate("repositoryPlural")
        });
        pageIndicator.textContent = translate("page", { current: 1, total: 1 });
        previousButton.disabled = true;
        nextButton.disabled = true;
        emptyState.classList.add("hidden");
        showStatus(error.key || "unexpectedResponse", "error", error.params || {});
    } finally {
        setLoading(false);
    }
}

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
            throw { key: "userNotFound", params: { username } };
        }

        if (response.status === 403 || response.status === 429) {
            throw { key: "rateLimit", params: {} };
        }

        if (!response.ok) {
            throw {
                key: "apiError",
                params: { status: response.status, statusText: response.statusText }
            };
        }

        const pageRepositories = await response.json();

        if (!Array.isArray(pageRepositories)) {
            throw { key: "unexpectedResponse", params: {} };
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
    allLanguagesOption.textContent = translate("allLanguages");
    languageFilter.appendChild(allLanguagesOption);

    languages.forEach(language => {
        const option = document.createElement("option");
        option.value = language;
        option.textContent = language;
        languageFilter.appendChild(option);
    });

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
        const matchesLanguage = !selectedLanguage ||
            (repository.language && repository.language.trim().toLowerCase() === selectedLanguage.trim().toLowerCase());

        return matchesSearch && matchesLanguage;
    });

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
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
    const visibleRepositories = filteredRepositories.slice(
        startIndex,
        startIndex + CARDS_PER_PAGE
    );

    projectsGrid.replaceChildren();
    const resultLabel = filteredRepositories.length === 1
        ? translate("repository")
        : translate("repositoryPlural");
    resultsCount.textContent = translate("results", {
        count: filteredRepositories.length,
        label: resultLabel
    });

    if (visibleRepositories.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
        visibleRepositories.forEach(repository => {
            projectsGrid.appendChild(createRepositoryCard(repository));
        });
    }

    pageIndicator.textContent = translate("page", {
        current: currentPage,
        total: totalPages
    });
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
    visibility.textContent = repository.private ? translate("private") : translate("public");
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
    description.textContent = repository.description || translate("noDescription");

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
        forkLabel.textContent = translate("fork");
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
    loadButton.textContent = isLoading ? translate("loadingButton") : translate("loadRepositories");
}

function showStatus(key, type = "", params = {}) {
    lastStatus = { key, type, params };
    statusMessage.textContent = translate(key, params);
    statusMessage.className = `status-message ${type}`.trim();
}

// Apply the saved language before loading the initial GitHub profile.
applyTranslations();
loadRepositories(DEFAULT_USERNAME);
