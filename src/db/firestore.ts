import admin from "firebase-admin";

let initialized = false;

export function getFirestoreDb(): admin.firestore.Firestore {
  if (!initialized && admin.apps.length === 0) {
    // If running in local emulator or tests, FIRESTORE_EMULATOR_HOST might be set
    const projectId = process.env.GCLOUD_PROJECT || "meawakemecode-8a35b";
    admin.initializeApp({
      projectId,
    });
    initialized = true;
  }
  return admin.firestore();
}

/**
 * Helper to get references to standard top-level collections
 */
export function getCollections(db: admin.firestore.Firestore) {
  return {
    users: db.collection("users"),
    days: db.collection("days"),
    problems: db.collection("problems"),
    dayQuestions: db.collection("day_questions"),
    libraryPages: db.collection("library_pages"),
    emailLogs: db.collection("email_logs"),
  };
}

