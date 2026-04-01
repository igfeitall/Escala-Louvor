export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                canvas: '#f6f1e8',
                ink: '#1b1b18',
                accent: '#8e5a3c',
                accentSoft: '#d8b89f',
                forest: '#335c4c',
            },
            boxShadow: {
                panel: '0 22px 60px rgba(27, 27, 24, 0.1)',
            },
            fontFamily: {
                display: ['Georgia', 'serif'],
                body: ['Segoe UI', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
