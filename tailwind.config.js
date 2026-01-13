/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./app/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#2563eb',
                    dark: '#1d4ed8'
                }
            },
            boxShadow: {
                soft: '0 10px 24px rgba(31,41,55,0.10)'
            },
            borderRadius: {
                xl: '1rem'
            }
        },
    },
    plugins: [],
};
