/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                display: ['"Exo 2"', 'system-ui', 'sans-serif'],
                body: ['"Golos Text"', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
    ],
}
