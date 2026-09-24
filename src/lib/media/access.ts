/**
 * The access decision for a stored media object. Pure — the database supplies
 * the row, this decides, and the route does what it says.
 */

export type MediaVisibility = "public" | "unlisted" | "private"

/** The columns the decision needs. Anything else is none of its business. */
export interface MediaObject {
  ownerId: string
  visibility: MediaVisibility
  /** Set when a moderator has taken the object down. Outranks visibility. */
  removedAt: string | null
}

/**
 * May `viewerId` (null when signed out) see this object?
 *
 * `unlisted` means "anyone with the link", which is what a public bucket gave
 * us by accident. Here it is a choice on the row, and it can be withdrawn.
 */
export function canViewMedia(object: MediaObject, viewerId: string | null): boolean {
  const isOwner = viewerId !== null && viewerId === object.ownerId

  // A removed object stays visible to its owner so they can see what happened;
  // removal is a moderation decision, not a way to hide it from the person
  // whose face is in it.
  if (object.removedAt !== null) return isOwner

  if (object.visibility === "public" || object.visibility === "unlisted") return true
  return isOwner
}
