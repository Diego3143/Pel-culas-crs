import { db } from './firebase';
import { ref, get, update, child } from 'firebase/database';

/**
 * Updates the authorName for all comments made by a specific user.
 * This function iterates through all content, then all comments for that content,
 * and updates the author's name if the authorId matches.
 * 
 * NOTE: This is a client-side operation that can be resource-intensive if the 
 * number of comments or content items is very large. For production apps at scale,
 * a server-side solution (e.g., Cloud Function) would be more appropriate.
 * 
 * @param userId The UID of the user whose name is being updated.
 * @param newName The new display name for the user.
 */
export async function updateCommentAuthorNames(userId: string, newName: string) {
  const commentsRootRef = ref(db, 'comments');
  const allContentSnapshot = await get(commentsRootRef);

  if (!allContentSnapshot.exists()) {
    console.log("No comments found to update.");
    return;
  }

  const updates: { [key: string]: any } = {};
  const allContent = allContentSnapshot.val();

  // Iterate over each contentId (e.g., movie or series ID)
  for (const contentId in allContent) {
    const commentsForContent = allContent[contentId];
    
    // Iterate over each commentId for the current content
    for (const commentId in commentsForContent) {
      const comment = commentsForContent[commentId];
      
      // If the comment was made by the user, prepare an update
      if (comment.authorId === userId) {
        const commentPath = `comments/${contentId}/${commentId}/authorName`;
        updates[commentPath] = newName;
      }
    }
  }

  // If there are updates to be made, apply them all at once
  if (Object.keys(updates).length > 0) {
    console.log(`Updating ${Object.keys(updates).length} comments for user ${userId}...`);
    await update(ref(db), updates);
    console.log("Comment author names updated successfully.");
  } else {
    console.log("No comments by this user needed updating.");
  }
}
