/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0F172A',
                surface: '#1E293B',
                primary: '#7C3AED',
                secondary: '#06B6D4',
                text: '#F8FAFC',
                muted: '#94A3B8',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
