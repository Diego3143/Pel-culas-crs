import { db } from './firebase';
import { ref, get, update } from 'firebase/database';

/**
 * Updates the authorName for all messages in the global chat sent by a specific user.
 * 
 * @param userId The UID of the user whose name is being updated.
 * @param newName The new display name for the user.
 */
export async function updateChatMessageAuthorNames(userId: string, newName: string) {
  const chatRef = ref(db, 'global_chat');
  const snapshot = await get(chatRef);

  if (!snapshot.exists()) {
    console.log("No chat messages found to update.");
    return;
  }

  const updates: { [key: string]: any } = {};
  const allMessages = snapshot.val();

  for (const messageId in allMessages) {
    const message = allMessages[messageId];
    if (message.authorId === userId) {
      const messagePath = `global_chat/${messageId}/authorName`;
      updates[messagePath] = newName;
    }
  }

  if (Object.keys(updates).length > 0) {
    console.log(`Updating ${Object.keys(updates).length} chat messages for user ${userId}...`);
    await update(ref(db), updates);
    console.log("Chat message author names updated successfully.");
  } else {
    console.log("No chat messages by this user needed updating.");
  }
}
