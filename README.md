# GitHub Project Explorer

A responsive HTML, CSS, and vanilla JavaScript application that retrieves and displays public repositories from any GitHub user through the official GitHub REST API.

## Features

- Fetches all public repositories, including accounts with more than 100 repositories (API pagination).
- Search repositories by name, description, or topic.
- Filter repositories by primary programming language.
- Sort by recently updated, recently created, stars, or name.
- Displays repository descriptions, language, stars, forks, and visibility.
- Shows summary statistics for repository count, languages, and stars.
- Responsive layout for desktop, tablet, and mobile.
- English and Spanish interface translations with a language selector.
- Remembers the selected language with `localStorage`.
- No API key or authentication required for public repositories.

## Technologies

- HTML5
- CSS3
- JavaScript (ES6+)
- GitHub REST API

## Getting started

1. Download or clone this repository.
2. Open `index.html` in your browser.

For a local development server, you can use the VS Code Live Server extension.

## Change the interface language

Use the language selector in the top-right corner to switch between English and Spanish. The selected language is saved in the browser, so it is restored the next time the page is opened.

To add or edit translations, update the `translations` object near the top of `js/app.js`.

## Change the default GitHub account

Open `js/app.js` and change:

```javascript
const DEFAULT_USERNAME = "miguelestradam3";
```

You can also enter another GitHub username in the search field at the top of the page.

## API endpoint

The application uses:

```text
https://api.github.com/users/{username}/repos
```

The API is public and does not require a token for public repository data. Unauthenticated requests are subject to GitHub's rate limit (typically 60 requests per hour).

Official documentation:
https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user

## Project structure

```text
github-project-explorer/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Notes

- This project lists repositories owned by the requested user. It does not list GitHub Projects (project-management boards).
- Private repositories are not returned by this public, unauthenticated endpoint.
- GitHub may return an error if its API rate limit has been reached.

## License

This project is available for learning and portfolio use.
