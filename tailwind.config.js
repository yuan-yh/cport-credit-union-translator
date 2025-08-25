/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cport-blue': '#1e40af',
                'cport-light': '#3b82f6',
                'cport-green': '#10b981',
                'cport-yellow': '#f59e0b',
                'cport-red': '#ef4444'
            }
        },
    },
    plugins: [],
}
