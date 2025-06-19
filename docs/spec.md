# Detailed Specification: Worksheet Problem Generator

**Project Goal:** To create a web application that generates additional practice problems based on a photo of a math or grammar worksheet, adapting to the original worksheet's concepts, question formats, and even handwriting to provide clean, new problems and their answers. The app is transient, designed for quick, on-demand use.

---

### 1. User Journey & Core Flow

The application follows a linear, step-by-step user flow:

1.  **Input Selection Screen:**
    *   **Header:** "Worksheet Generator"
    *   **Descriptive Text:** "This web application uses AI to generate a new set of problems from a worksheet. Please submit a worksheet for analysis:"
    *   **Action Buttons:** Two distinct buttons: "Take a photo" and "Upload a file".
    *   **Footer:** "Made with Google Gemini by JohnRiv"

2.  **Image Preview & Blank Check Screen:**
    *   **Navigation:** Appears immediately after a user takes a photo or selects a file.
    *   **Image Preview:** Displayed inline, below the transformed action buttons.
        *   **Sizing:** Max width: `viewport_width - 40px`. Max height: `viewport_height - 40px`. Aspect ratio maintained.
    *   **Action Buttons (transformed):** The original "Take a photo" button becomes "Retake Photo", and "Upload a file" becomes "Upload a different file". Clicking these discards the current preview and returns to the camera/file selection.
    *   **Blank Worksheet Radios:** Presented below the image preview.
        *   "This worksheet has writing on it (answers, things crossed out, marks. etc.)"
        *   "This worksheet has no answers or other marks" (Selected by default).
        *   *Purpose:* This user input directly controls whether the first AI pass (mark removal) is executed.
    *   **Call to Action:** "Generate Problems" button below the radio options.
    *   **Persistent UI:** Header and Footer remain present on this screen.

3.  **Processing Indicator (Modal):**
    *   **Behavior:** Appears as a full-screen modal in the center of the screen, disabling underlying UI, during AI operations.
    *   **Dynamic Text:**
        *   "Analyzing worksheet..." (during initial AI image analysis).
        *   "Generating problems..." (during Gemini API call for problem generation).

4.  **Practice Problem Display Screen:**
    *   **Content:** Displays all generated problems on a single page.
    *   **Answer Bank Display (Conditional):** If `answer_bank_present` is `true` in the Gemini response:
        *   A "Answer Bank" section appears at the top of the page, above the questions.
        *   Contents: A shuffled bulleted list of *only* the correct answers to the generated problems.
    *   **Problem Presentation:** Each problem (question) is displayed without its answer initially.
    *   **Persistent UI:** Header and Footer remain present on this screen.
    *   **UI Controls (Buttons at bottom of screen):**
        *   **"Reveal Answers"**: Global button.
            *   **Behavior:** When clicked, the answer for each problem appears directly below its question.
            *   **Formatting:** Prefixed with "Answer:", and both "Answer:" and the answer text are displayed in red. *This applies even if an answer bank was presented.*
        *   **"Generate a new set of questions like these"**:
            *   **Behavior:** Uses the *same* previous AI analysis (JSON output) and *same* previously specified quantity to re-request problems from Gemini. Skips image processing.
        *   **"Reanalyze the original worksheet"**:
            *   **Behavior:** Triggers a modal dialog.
            *   **Dialog Content:** Contains a text input field with the prompt: "What do you want the AI to specifically do or not do when generating the problems?".
            *   **Dialog Action:** "Regenerate Problems" button.
            *   **Process:** When clicked, the original worksheet image is re-sent for AI analysis. The user's input from the text field (max 1024 chars, sanitized) is appended to the `additional_notes_for_generation` field of the newly generated AI analysis JSON, which then feeds Gemini.

---

### 2. AI Analysis & Problem Generation

The core intelligence of the application resides in two main AI phases:

**Phase 1: Worksheet Analysis (Image to Structured Data)**

*   **Input:**
    *   Image captured via device camera or uploaded from gallery/files.
    *   **Supported Formats:** Whatever Google Gemini's image capabilities accept. No app-level file size/resolution checks.
    *   **User Decision:** "This worksheet has writing on it..." (Yes/No) determines if AI performs mark removal. If "no writing", mark removal is skipped.
*   **AI Pre-processing (if needed):** A fully automated process to detect and exclude child's handwriting and other marks from the worksheet image before core analysis.
*   **Output:** A structured JSON object representing the worksheet's characteristics. This is the primary input for Gemini's problem generation.

    ```json
    {
      "identified_concepts": [
        {
          "subject": "Math", // e.g., "Math", "Grammar", etc.
          "main_topic": "Multiplication", // e.g., "Multiplication", "Pronouns"
          "specific_concept": "2-digit by 2-digit multiplication" // e.g., "Reflexive Pronouns"
        }
        // Multiple concepts possible if a worksheet covers multiple areas
      ],
      "identified_question_formats": [
        "solve and show work" // e.g., "fill-in-the-blank", "multiple choice (A, B, C, D)", "underline the correct word"
        // Multiple formats possible
      ],
      "example_questions": [
        "23 x 45 =", // Array of strings, each being actual question text from the original worksheet. Crucial for guiding generation.
        "12 x 34 ="
      ],
      "answer_bank_present": false, // Boolean: true if original worksheet has an answer bank, false otherwise.
      "additional_notes_for_generation": "" // Optional string: initially empty, appended by user input during "Reanalyze"
    }
    ```

**Phase 2: Problem Generation (Structured Data to New Problems)**

*   **AI Model:** Google Gemini.
*   **Input:** The JSON output from Phase 1, plus the requested `NUMBER` of problems.
*   **Problem Quantity:**
    *   `5` problems by default.
    *   User has an option (via "Reanalyze" flow, with `additional_notes_for_generation`) to specify a different quantity (though currently not explicit in UI, implied by prompt flexibility). The "Generate a new set of questions like these" button re-uses the previously generated quantity.
*   **Problem Distribution (Multiple Concepts):** If multiple concepts are identified, Gemini is instructed to distribute the total requested `NUMBER` of problems across them as it deems appropriate, without explicit numerical instruction per concept from the application.
*   **Gemini Prompt Construction:**
    ```
    "The following JSON contains information about a school worksheet, including identified concepts, question formats, and example questions.
    Create a new set of ${NUMBER} practice problems that can test these same concepts, using similar question formats and styles to the example questions (but not the exact same content as those questions).
    The output should be a JSON response structured as follows:
    ```json
    {
      "problems": [
        {
          "question": "Newly generated question text here?",
          "answer": "Solution/Answer for question here?"
        }
      ],
      "answer_bank_present": <boolean value from input JSON>
    }
    ```
    Ensure the problems are distributed across all identified concepts as Gemini deems appropriate."
    ```
*   **Output (Expected from Gemini):**

    ```json
    {
      "problems": [
        {
          "question": "Newly generated question 1 text?",
          "answer": "Solution/Answer for question 1?"
        },
        {
          "question": "Newly generated question 2 text?",
          "answer": "Solution/Answer for question 2?"
        }
        // ... {NUMBER} problems ...
      ],
      "answer_bank_present": true // Boolean value passed from the AI analysis input.
    }
    ```

---

### 3. User Experience (UI/UX) / Non-Functional Requirements

*   **Responsiveness:**
    *   The web app must work well on mobile phone, tablet portrait, and tablet landscape viewports.
    *   Layouts should be fluid.
    *   **Specific:** The "Answer Bank" can be shown as multiple columns in wider viewports if its items are short (one or two words/numbers).
    *   Otherwise, elements should be consistent across screen sizes.
*   **User Accounts/Data Storage:**
    *   **No user accounts required.**
    *   App is purely transient: no personal data storage, no historical records.
    *   No ability to share, save, or print generated content.
*   **Customization (User Input to AI):**
    *   When "Reanalyze the original worksheet," an optional text input (max 1024 chars) is provided for the user to guide the AI.
    *   **Sanitization:** User input for `additional_notes_for_generation` MUST be sanitized with a combination of methods:
        1.  **Character Escaping/Encoding:** To ensure text is always interpreted as literal content within the Gemini prompt.
        2.  **Keyword/Phrase Filtering:** Actively look for and neutralize known prompt injection phrases, specifically those designed to override or bypass previous instructions (e.g., "ignore any previous instructions").
        3.  **Input/Format Validation:** Ensure valid UTF-8 and prevent malformed data.

---

### 4. Error Handling

*   **Image Capture/Upload Failures:**
    *   **Presentation:** Specific error message displayed in a modal dialog, requires user interaction.
    *   **Actions:** Dialog includes:
        *   **"Re-try" button:** Intelligently re-triggers camera if camera was used, or re-opens file selection dialog if file upload was chosen.
        *   **"Cancel" button:** Returns user to the initial input selection screen.
*   **Other Technical Errors (AI service, unparseable response, general app errors):**
    *   **Presentation:** Specific error message displayed in a modal dialog, requires user interaction.
    *   **Actions:** Dialog includes:
        *   **"Start Over" button:** Clears all current state and reloads the web app to the very first Input Selection screen.

---

### 5. Backend & Infrastructure

*   **Architecture:** Client-side web application (HTML, CSS, JS) interacting with a Node.js server-side component.
*   **Node.js Backend Purpose:** Acts as a proxy layer, handling all calls to the Google Gemini API and relaying responses to the client. This is for security (API key protection) and potentially for more complex prompt construction.
*   **API Key Management:** Google Cloud Project API keys should be stored in environment variables, read by Node.js on startup, and excluded from Git.
*   **Hosting Environment:** Google Cloud Platform.
    *   **Specific Service:** Firebase App Hosting will be used for the entire application, deploying both the frontend assets and the Node.js backend.
*   **Traffic:** Low, no specific scalability planning beyond default Firebase App Hosting capabilities.

---