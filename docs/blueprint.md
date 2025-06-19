# **App Name**: School Worksheet Generator

## Core Features:

- Image Upload: Allow users to upload a worksheet image from their device's photo gallery or take a photo directly using their camera.
- Worksheet Analysis: Utilize AI to analyze the worksheet image. If selected, the AI tool will attempt to remove handwriting, identify concepts, question formats, and example questions. Produce a JSON suitable for creating new practice problems.
- Problem Generation: Generate a specified number of practice problems based on the AI analysis of the worksheet, mimicking the original format and concepts using Google Gemini.
- Problem Display: Display the generated problems in a clean, readable format on a dedicated screen.
- Answer Reveal: Include an option to reveal the answers to the generated problems.
- Regenerate Problems: Provide a button to generate a new set of practice problems using the same AI analysis as before. Also, let the user customize generation via prompt.
- Display Answer Bank: If the analysis indicates that the original work sheet has an answer bank, display an answer bank in random order.

## Style Guidelines:

- Primary color: Dark Blue (#023047) for a calm, intellectual feel.
- Background color: Light blue (#8ecae6) - same hue as the primary color.
- Accent color: Soft orange (#E07A5F) - analogous to dark blue, with contrasting brightness and saturation.
- Body and headline font: 'PT Sans' sans-serif for modern readability.
- Code font: 'Source Code Pro' for displaying JSON data.
- Responsive design to ensure a consistent experience across mobile, tablet, and desktop devices.
- Subtle loading animations to indicate processing during AI analysis and problem generation.