# International Translator

Cute way to transcribe in real-time using AI-powered translation and Firebase backend.

## Features

- 🎤 **Real-time Transcription**: Capture and transcribe audio instantly
- 🤖 **AI-Powered Translation**: Powered by Google Gemini AI for accurate translations
- 🔥 **Firebase Integration**: Secure backend with real-time data sync
- ⚡ **Fast & Responsive**: Built with React 19, Vite, and Tailwind CSS
- 🎨 **Modern UI**: Smooth animations with Motion library

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **AI**: Google Gemini API (`@google/genai`)
- **Backend**: Firebase, Express.js
- **Styling**: Tailwind CSS, Lucide React icons
- **Build Tool**: Vite 6

## Run Locally

**Prerequisites:** Node.js (v16+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env.local`
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run clean` - Remove build artifacts
- `npm run lint` - Run TypeScript type checking

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create a new API key
3. Add it to your `.env.local` file

## License

MIT

## Contributing

Feel free to fork and submit pull requests!